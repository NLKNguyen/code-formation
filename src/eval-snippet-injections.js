const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const chalk = require("chalk")
const colorize = require("json-colorizer")
const common = require("./common.js")
const { NodeVM, VM, VMScript } = require("vm2")
const { DateTime } = require("luxon")
const SExpr = require("s-expression.js")
const logger = require("./logger")
const source_id = "evalSnippetInjection"

async function evalBlock(
  params,
  lines,
  line_number,
  openRegexCallback,
  closeRegexCallback,
  macroExpansionCallback
) {
  const injection = {
    macroExpansion: false,
    blockContent: [],
    snippetInjection: false,
    params: {},
    args: {
      INPUT: "",
      // LOGGER: logger
    },
    lineNumber: line_number,
  }

  let line = lines[injection.lineNumber]

  let openRegex = openRegexCallback(common.profile.marker_prefix)
  let matched = openRegex.exec(line)
  if (!matched) {
    return null
  }
  injection.snippetInjection = true
  // console.dir(matched)
  // process.exit()
  const label = _.get(matched, "[1]", "").trim()
  const command = _.get(matched, "[2]", "").trim()
  const rest = _.get(matched, "[3]", "").trim()
  injection.command = command
  // console.log(`injection.command = '${injection.command}'`)
  // console.log(`injection.snippetInjection = ${injection.snippetInjection}`)
  if (closeRegexCallback) {
    const closeRegex = closeRegexCallback(common.profile.marker_prefix, label)

    injection.lineNumber = line_number
    while (++injection.lineNumber < lines.length) {
      let blockLine = lines[injection.lineNumber]
      if (closeRegex.exec(blockLine)) {
        break
      } else {
        injection.blockContent.push(blockLine)
      }
    }
  }

  injection.params = await common.parseParams(rest)

  const NEWLINE = _.get(injection.params, ["NEWLINE"], common.profile.NEWLINE)
  const INPUT = injection.blockContent.join(NEWLINE)

  const LOGGER = logger

  injection.args = _.merge({}, injection.params, {
    INPUT,
    LOGGER,
  })
  let snippet_name = command
  if (snippet_name.startsWith("@")) {
    injection.macroExpansion = true
    snippet_name = snippet_name.split("@")[1]
    // console.dir(snippet_name)

    const snippet = _.get(profile, ["snippets", snippet_name])
    if (_.isUndefined(snippet)) {
      //  && !_.includes(["PASSTHROUGH"], command)
      throw new Error(
        `[${source_id}] cannot find the snippet ${snippet_name} for macro expansion`
      )
    }

    let context = _.merge({}, params, snippet.params, injection.args)

    const macro = await common.invoke(snippet, context)
    const expansion = common.serializeMacro(`(${macro})`)

    lines[line_number] = line.replace(openRegex, () => {
      return macroExpansionCallback(profile.marker_prefix, label, expansion)
    })
    log.info(
      `${chalk.cyan(`expand macro "@${snippet_name}":`)} ${chalk.gray(
        lines[line_number]
      )}`
    )
    // return injection
    // console.log(lines.join(LINE_FEED))
    // log.info(`lines[${line_number}] = ${lines[line_number]}`)
    // in next iteration with the same line_number, the macro
    // expansion will be inline to be evaluated like a regular instruction
  }

  return injection
}
async function evalSnippetInjection(content, params, profile, log) {
  // console.dir(params)
  // process.exit()
  let hasSnippetInjection = false
  let LINE_FEED = _.get(params, ["LINE_FEED"])

  // const OUT_DIR = _.get(profile, "OUT_DIR")
  // console.log(content)
  // process.exit()
  // console.log(params)
  // console.log(profile)

  const lines = content.split(/\r?\n/)
  let line_number = 0
  const result = []

  // const blockSnippetOpenRegex = new RegExp(
  //   `(?<!\`)${profile.marker_prefix}\\$([A-Za-z0-9_]*)\\[:([@A-Za-z0-9_]+)(\\s*\\(.*\\))?`
  // )

  // // const inlineSnippetRegex = new RegExp(
  // //   `(?<!\`)${profile.marker_prefix}\\$([A-Za-z0-9_]*)!:([@A-Za-z0-9_]+)(\\s+[A-Za-z0-9_]+\\s*=\\s*\".*\")?`
  // // ) // TODO: accept optional label and include that in the macro expansion

  // const inlineSnippetRegex = new RegExp(
  //   `(?<!\`)${profile.marker_prefix}\\$([A-Za-z0-9_]*)!:([@A-Za-z0-9_]+)(\\s*\\(.*\\))?`
  // )

  while (line_number < lines.length) {
    const line = lines[line_number]
    // console.log(line)

    // let openRegex = blockSnippetOpenRegex
    let injection = null

    injection = await evalBlock(
      params,
      lines,
      line_number,
      (markerPrefix) =>
        new RegExp(
          `(?<!\`)${markerPrefix}\\$([A-Za-z0-9_]*)\\[:([@A-Za-z0-9_]+)(\\s*\\(.*\\))?`
        ),

      (markerPrefix, markerLabel) =>
        new RegExp(`(?<!\`)${markerPrefix}\\$${markerLabel}\\]`),

      (markerPrefix, markerLabel, macroExpansion) =>
        `${markerPrefix}$${markerLabel}[:${macroExpansion}`
    )

    if (injection && injection.macroExpansion) {
      continue
    }

    if (!injection) {
      injection = await evalBlock(
        params,
        lines,
        line_number,
        (markerPrefix) =>
          new RegExp(
            `(?<!\`)${markerPrefix}\\$([A-Za-z0-9_]*)!:([@A-Za-z0-9_]+)(\\s*\\(.*\\))?`
          ),
        null,
        (markerPrefix, markerLabel, macroExpansion) =>
          `${markerPrefix}$${markerLabel}!:${macroExpansion}`
      )
    }

    if (injection && injection.macroExpansion) {
      continue
    }

    if (!injection) {
      // console.log(`lines[${line_number}]: ${line}`)
      // console.dir(lines)
      // if (line_number > 2) {
      //   process.exit()
      // }

      result.push(line)
    } else {
      hasSnippetInjection = true
      // console.dir(injection)
      // console.dir(injection)
      // process.exit()
      let snippet

      if (injection.command === "INSERT") {
        // console.dir({injection})

        let FILE = _.get(injection.params, ["FILE"])

        // process.exit()
        // const CONTENT = _.get(injection_params, ["CONTENT"])
        const CURRENT_TIME = _.get(injection.params, ["CURRENT_TIME"])
        // const FILTERS = _.get(injection_params, ["CURRENT_TIME"])
        if (common.isOnlyOneDefined([FILE, CURRENT_TIME])) {
          throw new Error(
            `INSERT command required either FILE, or CURRENT_TIME parameter`
          )
        }

        let template

        if (!_.isUndefined(FILE)) {
          // if (FILE.startsWith("@")) {
          //   FILE = FILE.substring(1)
          // } else {
          //   FILE = path.join(OUT_DIR, FILE)
          // }

          log.info(`${chalk.blueBright(`insert file`)} ${chalk.gray(FILE)}`)
          // log.info(colorize(injection_params))

          const templateString = fs.readFileSync(FILE, "utf8")
          // TODO: make reusable function for making snippet
          template = templateString.split(LINE_FEED)
        }

        // if (!_.isUndefined(CONTENT)) {
        //   template = CONTENT.split(LINE_FEED)
        // }

        if (!_.isUndefined(CURRENT_TIME)) {
          // console.log(CURRENT_TIME)
          template = [DateTime.now().toFormat(CURRENT_TIME)]
          // console.log(template)
        }

        snippet = {
          kind: "snippet",
          // matched,
          params: injection.params,
          template,
        }
        _.set(
          snippet.params,
          "LANGUAGE",
          _.get(injection.params, "LANGUAGE", "ejs")
        )
        // console.dir({
        //   injection,
        //   snippet,
        // })
        // process.exit()
      } else if (injection.command !== "TRANSFORM") {
        // console.dir(injection)
        // const snippet_name = _.get(matched, "[1]", "").trim()

        log.info(
          `${chalk.cyan(
            `load snippet ${chalk.blue(`[${injection.command}]`)}`
          )}`
        )
        snippet = _.get(profile, ["snippets", injection.command])
        // console.log(profile)
        if (_.isUndefined(snippet)) {
          //  && !_.includes(["PASSTHROUGH"], command)
          throw new Error(
            `[${source_id}] cannot find the snippet "${injection.command}"`
          )
        }
      }
      let content = ""
      let context = _.merge({}, params, injection.args)
      // console.dir({ context })
      if (snippet) {
        let evaluatedContent
        let data = context.INPUT
        do {
          log.info(
            `${chalk.cyan(
              `try evaluate nested snippet injections`
            )}`
          )
          // console.dir({
          //   context,
          //   // "context.args.INPUT": context.args.INPUT,
          //   // "injection.args.injection_params": injection.args.injection_params,
          //   // evaluatedContent,
          // })
          evaluatedContent = await evalSnippetInjection(
            data,
            params,
            profile,
            log
          ) // TODO: use common.profile and logger
          // console.dir({ evaluatedContent })

          data = evaluatedContent.data

          // process.exit()
          // context.INPUT = evaluatedContent.data
        } while (evaluatedContent.hasSnippetInjection)

        // console.log(context.INPUT)
        // process.exit()

        context = _.merge({}, params, snippet.params, injection.args)
        context.INPUT = evaluatedContent.data
        // console.dir({ params, "snippet.params": snippet.params })
        // process.exit()
        content = await common.invoke(snippet, context)
        // console.dir({ snippet, context, content })
      }

      // console.dir({
      //   injection,
      //   // context
      // })
      // process.exit()

      // console.log(content)
      //   let FILTERS = _.get(injection_params, ["FILTERS"], [])

      //   // log.info(`${colorize(FILTERS, { pretty: true })}`)

      //   for (let filter of FILTERS) {
      //     for (const [handler, params] of Object.entries(filter)) {
      //       // console.log(key, value)
      //       const handle = _.get(profile.plugins.filters, handler)
      //       let context = {
      //         plugins: profile.plugins,
      //         libraries: profile.libraries,
      //         logger: log,
      //         LINE_FEED,
      //         data: rendered,
      //         params,
      //       }
      //       rendered = await handle(context)
      //       break
      //     }
      //     // const key = Object.keys(filter)[0]
      //     // const value =
      //     // log.info(`${Object.keys(filter)[0]}`)
      //   }
      //   result.push(rendered)
      // }

      result.push(content)

      line_number = injection.lineNumber
    }

    line_number += 1
  }
  const output = result.join(LINE_FEED)

  // console.dir(output)
  // process.exit()

  if (hasSnippetInjection) {
    return evalSnippetInjection(output, params, profile, log)
  } else {
    return {
      data: output,
      hasSnippetInjection,
    }
  }
}

module.exports = evalSnippetInjection
