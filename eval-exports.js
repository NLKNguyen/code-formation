const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const chalk = require("chalk")
const colorize = require("json-colorizer")

module.exports = function (files, profile) {
  console.log(chalk.cyanBright("eval-exports"))
  const export_dir = _.get(profile, "export_dir")
  const newline_char = _.get(profile, "newline_char")
  for (let component of _.get(profile, "exports", [])) {
    const template_str = _.join(_.get(component, "content", []), newline_char)
    console.log(
      colorize(component, {
        pretty: true,
      })
    )
    try {
      const compiled = _.template(template_str)
      const rendered = compiled()
      console.log(rendered)
      const outfile = _.get(component, ["params", "OUT"])
      // console.log(export_dir, outfile)
      fs.writeFileSync(path.join(export_dir, outfile), rendered)
    } catch (e) {
      const start = _.get(component, "start")
      const end = _.get(component, "end")
      const src = _.get(component, "src")

      throw new Error(
        `${src}:${start}-${end}: failed template compilation. ${e}`
      )
    }
  }
}
