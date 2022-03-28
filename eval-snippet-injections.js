const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const chalk = require("chalk")
const colorize = require("json-colorizer")

const method = "eval_snippet_injections"

module.exports = function (content, params, profile, log) {
  const NEWLINE_CHAR = _.get(params, ["NEWLINE_CHAR"])

  const lines = content.split(/\r?\n/)
  let line_number = 0
  const result = []
  while (line_number < lines.length) {
    const line = lines[line_number]
    const regex = new RegExp(`${profile.marker_prefix}\\$!:(\\w+)(\\s.*)?`)

    const matched = line.match(regex)
    if (!matched) {
      result.push(line)
    } else {
      const snippet_name = _.get(matched, "[1]", "").trim()
      const rest = _.get(matched, "[2]", "").trim()
      let params = {}
      if (!_.isEmpty(rest)) {
        try {
          params = parsePairs.default(rest)
        } catch (e) {
          log.error("invalid params")
          throw new Error(
            `[${method}] encountered invalid params on line ${line_number} of the blob:\n${line}`
          )
        }
      }

      const snippet = _.get(profile, ["snippets", snippet_name])
      if (_.isUndefined(snippet)) {
        throw new Error(`[${method}] cannot find the snippet ${snippet_name}`)
      }

      merged_params = _.merge({}, snippet.params, params) 
    //   log.info('merged_params', colorize(snippet.params), colorize(params), colorize(merged_params))

      const template_str = snippet.template.join(NEWLINE_CHAR)
      const compiled_template = _.template(template_str)
      const rendered = compiled_template(merged_params)

      result.push(rendered)
    }
    line_number += 1
  }
  return result.join(NEWLINE_CHAR)
}
