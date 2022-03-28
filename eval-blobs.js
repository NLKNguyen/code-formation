const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const chalk = require("chalk")
const colorize = require("json-colorizer")

const eval_snippet_injections = require("./eval-snippet-injections")

const source_id = "eval-blobs"

module.exports = function (files, profile, log) {
  // console.log(chalk.cyanBright("eval-blobs"))
  const OUTDIR = _.get(profile, "outdir")

  for (let component of _.get(profile, "tasks", [])) {
    // TODO: caller should specify the task and this only apply to that
    // const SRC = _.get(component, ["SRC"])

    const params = _.get(component, ["params"])
    const OUT = _.get(params, ["OUT"])
    const OUTFILE = _.get(params, ["OUT"])
    // const outfile = OUT.split(":")[0]
    // const outslot = OUT.split(':')
    const OUTSLOT = ""

    const ORDER = _.get(params, ["ORDER"], "")
    const NEWLINE_CHAR = _.get(
      params,
      ["NEWLINE_CHAR"],
      _.get(profile, "newline_char")
    )

    let SECTION_SEPARATOR = _.get(params, ["SECTION_SEPARATOR"])
    if (!_.isUndefined(SECTION_SEPARATOR)) {
      SECTION_SEPARATOR = SECTION_SEPARATOR.replace(/\\n/g, "\n").replace(
        /\\r/g,
        "\r"
      )
    }

    // SECTION_SEPARATOR = JSON.parse(`"${SECTION_SEPARATOR}"`)
    const template_str = _.join(_.get(component, "template", []), NEWLINE_CHAR)
    // console.log(
    //   colorize(component, {
    //     pretty: true,
    //   })
    // )

    const local_params = {} // _.pickBy(params, (v, k) => k[0] == k[0].toLowerCase() )

    try {
      const compiled = _.template(template_str)
      const variables = {
        OUT,
        OUTDIR,
        OUTFILE,
        ORDER,
        NEWLINE_CHAR,
        ...local_params,
      }
      // console.log(
      //   colorize(variables, {
      //     pretty: true,
      //   })
      // )
      const rendered = compiled(variables)
      console.log(rendered)

      // TODO: inject snippets here

      const enriched = eval_snippet_injections(
        rendered,
        variables,
        profile,
        log
      )

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
        content: enriched,
        options: {
          NEWLINE_CHAR,
          SECTION_SEPARATOR,
        },
        // separator: SECTION_SEPARATOR,
      })
      _.set(profile, [...outpath, `#${_.get(params, ["ORDER"])}`], destination)
      // console.log(destination)

      // _.set(profile, ['content', 'a'], output)
      // profile['content'] = rendered

      // console.log(outdir, outfile)
      // fs.writeFileSync(path.join(outdir, outfile), rendered)
    } catch (e) {
      const start = _.get(component, "start")
      const end = _.get(component, "end")
      const src = _.get(component, "src")

      throw new Error(
        `${src}:${start + 1}-${end + 1}: failed template compilation. ${e}`
      )
    }
  }
}
