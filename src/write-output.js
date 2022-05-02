// const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const chalk = require("chalk")
const colorize = require("json-colorizer")
const error = require("./error")
const common = require('./common')

module.exports = function (files, profile, log) {
  // log.info(chalk.cyanBright("write-output"))

  const output = _.get(profile, "output")
  const fileslots = _.keys(output).sort()

  for (let output_path of fileslots) {
    const package = output[output_path]
    const orders = _.keys(package).sort()

    let data = ""
    let last_separator

    for (let order of orders) {
      const { state, items } = package[order]
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
            
      log.info(`writing output to ${chalk.cyanBright(output_path)}`)
      common.writeFileSyncRecursive(output_path, data, 'utf8')
      // fs.writeFileSync(output_path, data)
    } catch (e) {
      throw new Error(error.message(e, log))
    }
    // const SRC = _.get(component, ["SRC"])
  }
}
