// const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const chalk = require("chalk")
const colorize = require("json-colorizer")
const error = require("./error")
const common = require("./common")

module.exports = async function (files, profile, log) {
  // log.info(chalk.cyanBright("write-output"))

  const output = _.get(profile, "output")
  const fileslots = _.keys(output).sort()

  // console.dir(fileslots)
  for (let output_path of fileslots) {
    // console.log(output_path)
    // process.exit()
    const package = output[output_path]

    // console.dir(package)
    const orders = _.keys(package).sort()

    let data = ""
    // let data = []
    let target_anchor = ""
    let last_separator

    for (let order of orders) {
      let { anchor, state, items } = package[order]
      // console.dir(package[order])
      target_anchor = anchor
      // items = _.get(package[order], "items")
      // last_separator = _.get(package[order], ["state","options", "SECTION_SEPARATOR"], "")
      last_separator = _.get(state, ["options", "SECTION_SEPARATOR"], "")
      for (let item of items) {
        data += last_separator
        // data.push(last_separator)
        const content = item["content"]
        const separator = _.get(item, ["options", "SECTION_SEPARATOR"])
        if (!_.isUndefined(separator)) {
          last_separator = separator
          _.set(state, ["options", "SECTION_SEPARATOR"], separator)
          // throw new Error(colorize(item))
          // _.set(package[order], ["state", "options", "SECTION_SEPARATOR"], separator)
        }
        data += content
        // data.push(content)
      }
    }

    // log.info(data)
    if (target_anchor) {
      try {
        const output = []
        let focused_entity
        const content = fs.readFileSync(output_path, "utf8").trim()
        const lines = content.split(/\r?\n/)
        const openTagRegex = new RegExp(
          // `(?<!\`)${profile.marker_prefix}!(\\w*)<`
          `(?<!\`)${profile.marker_prefix}!([A-Za-z0-9_]+)<`
        )
        let line_index = 0
        while (line_index < lines.length) {
          let line = lines[line_index]

          if (!focused_entity) {
            output.push(line)

            const openTag = openTagRegex.exec(line)

            if (openTag) {
              const tag = _.get(openTag, "[1]", "").trim()
              const anchor = tag //_.get(openTag, "[2]", "").trim()

              if (anchor === target_anchor) {
                focused_entity = {
                  tag,
                  anchor,
                }
                // console.log(data)
                output.push(data.trimEnd())
              }
            }
          } else {
            const closeTagRegex = new RegExp(
              // `(?<!\`)${profile.marker_prefix}@${focused_entity.tag}>`
              `(?<!\`)${profile.marker_prefix}!${focused_entity.tag}>`
            )
            const closeTag = closeTagRegex.exec(line)
            if (closeTag) {
              output.push(line)
              focused_entity = undefined
            }
          }
          line_index += 1
        }

        const file_content = output.join("\n")
        // console.log(file_content)
        if (!_.isEmpty(output_path)) {
          log.info(
            `${chalk.green(`write output to '${target_anchor}' anchor in`)} ${chalk.gray(
              output_path
            )}`
          )
          common.writeFileSyncRecursive(output_path, file_content, "utf8")
        }

        // fs.writeFileSync(output_path, data)
      } catch (e) {
        throw new Error(error.message(e, log))
      }
    } else {
      try {
        if (!_.isEmpty(output_path)) {
          log.info(`${chalk.greenBright(`write output to`)} ${chalk.gray(output_path)}`)
          common.writeFileSyncRecursive(output_path, data, "utf8")
        }
        // common.writeFileSyncRecursive(output_path, data, "utf8")
        // fs.writeFileSync(output_path, data)
      } catch (e) {
        throw new Error(error.message(e, log))
      }
    }
    // const SRC = _.get(component, ["SRC"])
  }
}
