const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const chalk = require("chalk")
const colorize = require("json-colorizer")
const common = require("./common.js")

const source_id = "eval_snippet_injections"

module.exports = function (content, params, profile, log) {
  let LINE_FEED = _.get(params, ["LINE_FEED"])
  let LINE_PREFIX = _.get(params, ["LINE_PREFIX"])
  // console.log(params)

  const lines = content.split(/\r?\n/)
  let line_number = 0
  const result = []
  while (line_number < lines.length) {
    const line = lines[line_number]
    const regex = new RegExp(`${profile.marker_prefix}\\$!:(\\w+)(\\s.*)?`)
    const matched = regex.exec(line)
    // const matched = line.match(regex)
    if (!matched) {
      result.push(line)
    } else {
      // console.dir(matched)
      // log.info(`matched at index: ${matched.index}`)
      // log.info(`prefix: "${line.substring(0, matched.index)}"`)
      // throw new Error(matched)
      const command = _.get(matched, "[1]", "").trim()
      const rest = _.get(matched, "[2]", "").trim()

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
      LINE_PREFIX = _.get(injection_params, ["LINE_PREFIX"], LINE_PREFIX)

      LINE_PREFIX = common.makePrefixString(
        LINE_PREFIX,
        matched.input,
        matched.index
      )

      injection_params.LINE_FEED = LINE_FEED
      injection_params.LINE_PREFIX = LINE_PREFIX

      // log.info(colorize(rest))
      // log.info(colorize(injection_params))
      // log.info(`LINE_PREFIX "${LINE_PREFIX}"`)
      let snippet
      if (command === "INSERT") {
        const FILE = _.get(injection_params, ["FILE"])
        if (_.isUndefined(FILE)) {
          throw new Error(`FILE param is missing for INSERT command`)
        }

        log.info(`read file ${FILE}`)
        // log.info(colorize(injection_params))

        const template = fs.readFileSync(FILE, "utf8")
        // TODO: make reusable function for making snippet
        snippet = {
          kind: "snippet",
          matched,
          injection_params,
          template: template.split(LINE_FEED),
        }
      } else {
        // const snippet_name = _.get(matched, "[1]", "").trim()
        const snippet_name = command

        snippet = _.get(profile, ["snippets", snippet_name])
        if (_.isUndefined(snippet)) {
          throw new Error(
            `[${source_id}] cannot find the snippet ${snippet_name}`
          )
        }
      }
      // log.info(snippet)

      const merged_params = _.merge(
        { ...profile.variables },
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
      const compiled_template = _.template(template_str, { interpolate: null })
      // log.info(compiled_template)
      const rendered = compiled_template(merged_params)
      // log.info(rendered)
      result.push(rendered)
    }
    line_number += 1
  }
  return result.join(LINE_FEED)
}
