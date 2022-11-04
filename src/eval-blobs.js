const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const chalk = require("chalk")
const colorize = require("json-colorizer")
const error = require("./error.js")
const evalSnippetInjection = require("./eval-snippet-injections")
const common = require("./common.js")
const queryString = require("query-string")
const source_id = "eval-blobs"

module.exports = async function (files, profile, log) {
  // console.log(chalk.cyanBright("eval-blobs"))
  const OUT_DIR = _.get(profile, "OUT_DIR")

  for (let component of _.get(profile, "tasks", [])) {
    // TODO: caller should specify the task and this only apply to that

    const { matched, src, start, end, params } = component

    log.info(`${chalk.yellow(`evaluate blob [${start + 1}:${end + 1}] in`)} ${chalk.gray(src)}`)
    // console.dir(component)
    const INTO = _.get(params, ["INTO"])
    let FILE, ANCHOR
    // shorthand
    if (!_.isEmpty(INTO)) {
      FILE = src
      ANCHOR = INTO
    } else {
      FILE = _.get(params, ["FILE"], "")
      ANCHOR = _.get(params, ["ANCHOR"], "")
    }

    // if (!FILE) {
    //   throw new Error(
    //     `[${source_id}] Missing FILE or INTO parameter on ${src}:${start + 1}`
    //   )
    // }

    const OUTFILE = FILE

    // const outparts = FILE.split(":")

    // let OUTFILE = outparts[0]
    // let OUTSLOT = "" // TODO: no need anymore as we have ANCHOR variable
    // if (outparts.length > 1) {
    //   OUTSLOT = outparts[1]
    // }

    // const SNIPPET = _.get(params, ["SNIPPET"], "")
    // const SNIPPET_CONTENT_AS = _.get(params, ["SNIPPET_CONTENT_AS"], "")

    const ORDER = _.get(params, ["ORDER"], "")
    const LINE_FEED = _.get(params, ["LINE_FEED"], _.get(profile, "LINE_FEED"))

    let LINE_PREFIX = _.get(
      params,
      ["LINE_PREFIX"],
      _.get(profile, "LINE_PREFIX")
    )

    LINE_PREFIX = common.makePrefixString(
      LINE_PREFIX,
      matched.input,
      matched.index
    )

    // throw new Error()
    let SECTION_SEPARATOR = _.get(params, ["SECTION_SEPARATOR"])
    if (!_.isUndefined(SECTION_SEPARATOR)) {
      SECTION_SEPARATOR = SECTION_SEPARATOR.replace(/\\n/g, "\n").replace(
        /\\r/g,
        "\r"
      )
    }

    // SECTION_SEPARATOR = JSON.parse(`"${SECTION_SEPARATOR}"`)
    const template_str = _.join(_.get(component, "template", []), LINE_FEED)
    // console.log(
    //   colorize(component, {
    //     pretty: true,
    //   })
    // )

    const local_params = {} // _.pickBy(params, (v, k) => k[0] == k[0].toLowerCase() )

    try {
      // _.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;
      const compiled = _.template(template_str, {
        interpolate: /<%=([\s\S]+?)%>/g,
      }) //
      const variables = {
        ...profile.variables,
        OUT_DIR,
        FILE,
        OUTFILE,
        // OUTSLOT,
        ORDER,
        LINE_FEED,
        LINE_PREFIX,
        CURRENT_DIR: src.dirname(),
        CONTEXT_DIR: `.`,
        CURRENT_FILE: src,
        CURRENT_FILE_NAME: src.basename(),
        CURRENT_FILE_NAME_HASH: src.basename().createHash("shake256", { outputLength: 5 }),
        CURRENT_FILE_PATH: src,
        CURRENT_FILE_PATH_HASH: src.createHash("shake256", { outputLength: 5 }),
        ...local_params,
      }

      // log.info("variables")
      // log.info(colorize(variables, { pretty: true }))

      // log.info("params")
      // log.info(colorize(params, { pretty: true }))

      const rendered = compiled(variables)
      // log.info(rendered)

      let enriched = (await evalSnippetInjection(rendered, variables, profile, log)).data
      // console.dir({enriched})
      // process.exit()
      // if (!_.isEmpty(SNIPPET)) { // TODO: not using this
      //   const snippet = _.get(profile, ["snippets", SNIPPET])
      //   if (_.isUndefined(snippet)) {
      //     throw new Error(
      //       `[${source_id}] cannot find the snippet ${snippet_name}`
      //     )
      //   }

      //   // enriched = common.renderSnippet(snippet, params,)

      //   const template_str = snippet.template
      //     .map((e) => LINE_PREFIX + e)
      //     .join(LINE_FEED)

      //   let body = {}
      //   if (_.isEmpty(SNIPPET_CONTENT_AS)) {
      //     body = {
      //       content: enriched,
      //     }
      //   } else {
      //     body = {
      //       [SNIPPET_CONTENT_AS]: enriched,
      //     }
      //   }

      //   const merged_params = _.merge(snippet.params, { ...params }, body)
      //   const rendered = common.renderTemplate(template_str, merged_params)
      //   enriched = rendered
      //   log.info(enriched)
      // }

      const lines = enriched.split(/\r?\n/)
      let formatted_lines = []
      let continuous_empty_lines = 0
      for (let line of lines) {
        if (common.hasTemplateInstruction(profile, line)) {
          line = ""
        }
        if (_.isEmpty(line.trim())) {
          continuous_empty_lines += 1
          if (continuous_empty_lines > 1) {
            continue
          }
        } else {
          continuous_empty_lines = 0
        }
        formatted_lines.push(line)
      }

      formatted_lines = formatted_lines.map((e) => LINE_PREFIX + e)
      // for(let i = 0; i < formatted_lines.length; i += 1) {
      //   formatted_lines[i] = LINE_PREFIX + formatted_lines[i]
      // }

      let formatted_text = formatted_lines.join(LINE_FEED) + LINE_FEED
      // log.verbose(formatted_text)
      // console.dir({
      //   formatted_lines,
      //   formatted_text
      // })

      let FILTERS = _.get(params, ["FILTERS"], "")
        .split(/\s/)
        .filter(Boolean)

      // console.dir(params)
      for (let filter of FILTERS) {
        const parts = filter.split("?")
        // console.dir(parts)
        const filterName = _.get(parts, [0])
        const queryParams = _.get(parts, [1], "")
        let inline_params = queryString.parse(queryParams)
        inline_params = _.mapValues(inline_params, (value) => {
          if (value.startsWith("_")) {
            return _.get(params, value, value)
          } else {
            return value
          }
        })
       
        const handler = _.get(profile.plugins.filters, filterName)
        // console.dir(handler)
        // console.dir(inline_params)
        let context = {
          plugins: profile.plugins,
          libraries: profile.libraries,
          log,
          LINE_FEED,
        }
        formatted_text = handler(formatted_text, inline_params, context)
      }

      // if (!_.has(profile, ['content', ORDER])) {
      //   _.set(profile, ['content', ORDER], [])
      // }

      let blob_path = ""
      if (!_.isEmpty(OUTFILE)) {
        // if (OUTFILE.startsWith("@")) {
        //   blob_path = OUTFILE.substring(1)
        // } else {
        //   blob_path = path.join(OUT_DIR, OUTFILE)
        // }
  
        blob_path = path.resolve(OUTFILE)
      }
      
      // console.log(blob_path)

      // const outpath = ["output", blob_path]

      const outpath = ["output", blob_path, `#${ANCHOR}#${ORDER}`]

      // _.set(profile, [...outpath, 'params'], {
      //   SECTION_SEPARATOR
      // })
      const destination = _.get(profile, outpath, {
        anchor: ANCHOR,
        state: {},
        items: [],
      })
      destination.items.push({
        content: formatted_text,
        options: {
          LINE_FEED,
          SECTION_SEPARATOR,
        },
        // separator: SECTION_SEPARATOR,
      })
      _.set(profile, outpath, destination)
      // console.log(destination)

      // _.set(profile, ['content', 'a'], output)
      // profile['content'] = rendered

      // console.log(OUT_DIR, OUTFILE)
      // fs.writeFileSync(path.join(OUT_DIR, OUTFILE), rendered)
    } catch (e) {
      
      error.message(e, log)
      // TODO: use enhanced winston logger to automatically include source file/line number https://egghead.io/lessons/node-js-add-logging-to-a-node-js-application-using-winston
      throw new Error(
        `[${source_id}] Failed template processing ${src}:${start + 1}-${
          end + 1
        }` // : ${error.message(e, log)}
      )
    }
  }
}
