const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const queryString = require("query-string")
const chalk = require("chalk")
const colorize = require("json-colorizer")
const common = require("./common.js")
const { DateTime } = require("luxon")

const source_id = "eval_snippet_injections"

function eval_snippet_injections(content, params, profile, log) {
  let LINE_FEED = _.get(params, ["LINE_FEED"])

  const OUTDIR = _.get(profile, "OUTDIR")

  // console.log(params)
  // console.log(profile)

  const lines = content.split(/\r?\n/)
  let line_number = 0
  const result = []

  const blockSnippetOpenRegex = new RegExp(
    `(?<!\`)${profile.marker_prefix}\\$([A-Za-z0-9_]*)\\[:([@A-Za-z0-9_]+)(\\s+[A-Za-z0-9_]+\\s*=\\s*\".*\")?`
  )

  

  const inlineSnippetRegex = new RegExp(
    `(?<!\`)${profile.marker_prefix}\\$([A-Za-z0-9_]*)!:([@A-Za-z0-9_]+)(\\s+[A-Za-z0-9_]+\\s*=\\s*\".*\")?`
  ) // TODO: accept optional label and include that in the macro expansion
  

  let hasSnippetInjection = false
  while (line_number < lines.length) {
    const line = lines[line_number]
    
    let openRegex = blockSnippetOpenRegex

    const blockContent = []

    let matched = openRegex.exec(line)
    if (matched) {
      // console.dir(matched)
      const label = _.get(matched, "[1]", "").trim()
      const blockSnippetCloseRegex = new RegExp(
        `(?<!\`)${profile.marker_prefix}\\$${label}\\]`
      )
      
      
      while (++line_number < lines.length) {
        let blockLine = lines[line_number]
        if (blockSnippetCloseRegex.exec(blockLine)) {
          break
        } else {
          blockContent.push(blockLine)
        }
        
      }           
    } else {
      openRegex = inlineSnippetRegex
    }

    
    matched = openRegex.exec(line)
    // const matched = line.match(regex)
    if (!matched) {
      result.push(line)
    } else {
      
      hasSnippetInjection = true
      // console.dir(matched)
      // log.info(`matched at index: ${matched.index}`)
      // log.info(`prefix: "${line.substring(0, matched.index)}"`)
      // throw new Error(matched)
      const label = _.get(matched, "[1]", "").trim()
      const command = _.get(matched, "[2]", "").trim()
      const rest = _.get(matched, "[3]", "").trim()

      let injection_params = {}
      if (!_.isEmpty(rest)) {
        try {
          injection_params = parsePairs.default(rest)
          // log.info('injection_params')
          // log.info(colorize(injection_params))
        } catch (e) {
          throw new Error(
            `[${source_id}] encountered invalid params on line ${line_number} of the blob:\n${line}`
          )
        }
      }

      LINE_FEED = _.get(injection_params, ["LINE_FEED"], LINE_FEED)
      const CONTENT = blockContent.join(LINE_FEED)
      // console.log('CONTENT')
      // console.log('{{{')
      // console.log(CONTENT)
      // console.log('}}}')

      let LINE_PREFIX = _.get(
        injection_params,
        ["LINE_PREFIX"],
        _.get(profile, "LINE_PREFIX")
      )

      LINE_PREFIX = common.makePrefixString(
        LINE_PREFIX,
        matched.input,
        matched.index
      )

      let FILTERS = _.get(injection_params, ["FILTERS"], "")
        .split(/\s/)
        .filter(Boolean)
      // console.dir(FILTERS)
      injection_params.LINE_FEED = LINE_FEED
      injection_params.LINE_PREFIX = LINE_PREFIX
      // injection_params.FILTERS = FILTERS

      // log.info(colorize(rest))
      // log.info(colorize(injection_params))
      // log.info(`LINE_PREFIX "${LINE_PREFIX}"`)
      let snippet
      if (command === "INSERT") {
        let FILE = _.get(injection_params, ["FILE"])
        // const CONTENT = _.get(injection_params, ["CONTENT"])
        const CURRENT_TIME = _.get(injection_params, ["CURRENT_TIME"])
        // const FILTERS = _.get(injection_params, ["CURRENT_TIME"])
        if (common.isOnlyOneDefined([FILE, CURRENT_TIME])) {
          throw new Error(
            `INSERT command required either FILE, or CURRENT_TIME parameter`
          )
        }

        let template

        if (!_.isUndefined(FILE)) {
          if (FILE.startsWith("@")) {
            FILE = FILE.substring(1)
          } else {
            FILE = path.join(OUTDIR, FILE)
          }

          log.info(`read file ${FILE}`)
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
          matched,
          injection_params,
          template,
        }
      } else  {
        // const snippet_name = _.get(matched, "[1]", "").trim()
        let snippet_name = command
        let hasMacro = false
        if (command.startsWith("@")) {
          snippet_name = command.split("@")[1]
          hasMacro = true
        }

        snippet = _.get(profile, ["snippets", snippet_name])
        if (_.isUndefined(snippet) && !_.includes(["PASSTHROUGH"], command)) {
          throw new Error(
            `[${source_id}] cannot find the snippet ${snippet_name}`
          )
        }

        if (hasMacro) {
          const merged_params = _.merge(
            { ...params },
            snippet.params,
            injection_params
          )
          const template_str = snippet.template
            .map((e) => LINE_PREFIX + e)
            .join(LINE_FEED)

          // log.info(`template_str = ${template_str}`)
          let macro = common
            .renderTemplate(template_str, merged_params)
            .split(/\r?\n/)
            .filter(Boolean)
          let macroLines = []
          let hasPreviousTrailingSpace = true
          for (let line of macro) {
            let hasLeadingSpace = line.startsWith(" ")
            if (!hasPreviousTrailingSpace && !hasLeadingSpace) {
              macroLines.push(" " + line)
            } else {
              macroLines.push(line)
            }
            hasPreviousTrailingSpace = line.endsWith(" ")
          }
          let expansion = macroLines.join("")
          // log.info(`expansion = ${lines[line_number]}`)
          lines[line_number] = lines[line_number].replace(
            openRegex,
            () => {
              if (openRegex == blockSnippetOpenRegex) {
                return `${profile.marker_prefix}$${label}[:${expansion}`
              } else { // inlineSnippetRegex
                return `${profile.marker_prefix}$${label}!:${expansion}`
              }
            }
          )
          // log.info(`lines[${line_number}] = ${lines[line_number]}`)
          continue // in next iteration with the same line_number, the macro
          // expansion will be inline to be evaluated like a regular instruction
        }
      }
      // log.info(snippet)
      let rendered = CONTENT
      // console.log('---')
      // console.log(rendered)
      // console.log('---')
      if (!_.isUndefined(snippet)) {
        let merged_params = _.merge(
          { ...params, CONTENT },
          snippet.params,
          injection_params
        )
        
        // log.info("merged_params")
        // log.info(colorize(snippet.params))
        // log.info(colorize(params))
        // log.info(colorize(merged_params))
  
        const template_str = snippet.template
          .map((e) => LINE_PREFIX + e)
          .join(LINE_FEED)
  
        // log.info(template_str)
        // const compiled_template = _.template(template_str, { interpolate: null })
        // // log.info(compiled_template)
        // const rendered = compiled_template(merged_params)
        // log.info(template_str)
  
        rendered = common.renderTemplate(template_str, merged_params)
      } 
      


      for (let filter of FILTERS) {
        const parts = filter.split("?")
        // console.dir(parts)
        const filterName = _.get(parts, [0])
        const queryParams = _.get(parts, [1], "")
        let params = queryString.parse(queryParams)
        params = _.mapValues(params, (value) => {
          if (value.startsWith("_")) {
            return _.get(injection_params, value, value)
          } else {
            return value
          }
        })
        const handler = _.get(profile.plugins.filters, filterName)
        // console.dir(handler)
        // console.dir(params)
        let context = {
          plugins: profile.plugins,
          LINE_FEED,
        }
        rendered = handler(rendered, params, context)
      }
      result.push(rendered)
      
    }
    line_number += 1
  }
  const output = result.join(LINE_FEED)
  if (hasSnippetInjection) {
    return eval_snippet_injections(output, params, profile, log)
  } else {
    return output
  }
}

module.exports = eval_snippet_injections
