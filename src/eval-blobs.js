const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const chalk = require("chalk")
const colorize = require("json-colorizer")
const error = require('./error.js')
const eval_snippet_injections = require("./eval-snippet-injections")

const source_id = "eval-blobs"

module.exports = function (files, profile, log) {
  // console.log(chalk.cyanBright("eval-blobs"))
  const OUTDIR = _.get(profile, "OUTDIR")

  for (let component of _.get(profile, "tasks", [])) {
    // TODO: caller should specify the task and this only apply to that

    const { src, start, end, params }  = component
    
    const OUT = _.get(params, ["OUT"])
    if (!OUT) {
      throw new Error(`[${source_id}] Missing OUT parameter on ${src}:${start + 1}`)
    }
    const outparts =  OUT.split(":")
    let OUTFILE = outparts[0]
    let OUTSLOT = ""
    if (outparts.length > 1) {
      OUTSLOT = outparts[1]
    }


    const ORDER = _.get(params, ["ORDER"], "")
    const LINE_FEED = _.get(
      params,
      ["LINE_FEED"],
      _.get(profile, "LINE_FEED")
    )

    const LINE_PREFIX = _.get(
      params,
      ["LINE_PREFIX"],
      _.get(profile, "LINE_PREFIX")
    )

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
      const compiled = _.template(template_str)
      const variables = {
        OUTDIR,
        OUT,                
        OUTFILE,
        OUTSLOT,
        ORDER,
        LINE_FEED,
        LINE_PREFIX,
        ...local_params,
      }
      // console.log(
      //   colorize(variables, {
      //     pretty: true,
      //   })
      // )
      const rendered = compiled(variables)
      // log.verbose(rendered)
          
      const enriched = eval_snippet_injections(
        rendered,
        variables,
        profile,
        log
      )
      

      const lines = enriched.split(/\r?\n/)
      let formatted_lines = []
      let continuous_empty_lines = 0
      for(let line of lines) {
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

      formatted_lines = formatted_lines.map(e => LINE_PREFIX + e)
      // for(let i = 0; i < formatted_lines.length; i += 1) {
      //   formatted_lines[i] = LINE_PREFIX + formatted_lines[i]
      // }

      const formatted_text = formatted_lines.join(LINE_FEED)
      log.verbose(formatted_text)

      // if (!_.has(profile, ['content', ORDER])) {
      //   _.set(profile, ['content', ORDER], [])
      // }

      const blob_path = path.join(OUTDIR, OUTFILE)

      const outpath = ["output", blob_path]

      // _.set(profile, [...outpath, 'params'], {
      //   SECTION_SEPARATOR
      // })
      const destination = _.get(
        profile,
        [...outpath, `#${_.get(params, ["ORDER"])}`],
        {
          state: {},
          items: [],
        }
      )
      destination.items.push({
        content: formatted_text,
        options: {
          LINE_FEED,
          SECTION_SEPARATOR,
        },
        // separator: SECTION_SEPARATOR,
      })
      _.set(profile, [...outpath, `#${_.get(params, ["ORDER"])}`], destination)
      // console.log(destination)

      // _.set(profile, ['content', 'a'], output)
      // profile['content'] = rendered

      // console.log(OUTDIR, OUTFILE)
      // fs.writeFileSync(path.join(OUTDIR, OUTFILE), rendered)
    } catch (e) {
           

      throw new Error(
        `[${source_id}] Failed template compilation ${src}:${start + 1}-${end + 1}: ${error.message(e,log)}`
      )
    }
  }
}
