const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const chalk = require("chalk")
const colorize = require("json-colorizer")

module.exports = function (files, profile, log) {
  // log.info(chalk.cyanBright("write-output"))
  const OUTDIR = _.get(profile, "outdir")

  const output = _.get(profile, "output")
  const fileslots = _.keys(output).sort()

  for (let fileslot of fileslots) {
    const OUTFILE = fileslot
    // const outfile = key
    const package = output[fileslot]
    const orders = _.keys(package).sort()

    let data = ""
    let last_separator

    for (let order of orders) {  
      const {state, items} = package[order]    
      // items = _.get(package[order], "items")
      // last_separator = _.get(package[order], ["state","options", "SECTION_SEPARATOR"], "")
      last_separator = _.get(state, ["options", "SECTION_SEPARATOR"], "")
      for (let item of items) {
        data += last_separator
        const content = item["content"]
        const separator = _.get(item, ["options", "SECTION_SEPARATOR"])
        if (!_.isUndefined(separator)) {
          last_separator = separator
          _.set(state, ["options", "SECTION_SEPARATOR"], separator)
          // throw new Error(colorize(item))
          // _.set(package[order], ["state", "options", "SECTION_SEPARATOR"], separator)
        }
        data += content
      }
    }

    // log.info(data)
    try {
      fs.writeFileSync(OUTFILE, data)
    } catch (e) {
      throw new Error(`${e}`)
    }
    // const SRC = _.get(component, ["SRC"])
  }
}
