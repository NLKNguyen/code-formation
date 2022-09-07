const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")

const source_id = "scan-snippets"

module.exports = function (files, profile, log) {
  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8").trim()
    const lines = content.split(/\r?\n/)
    let line_index = 0
    const local_entities = []
    let focused_entity
    let focused_entity_start_line = 0
    let LINE_PREFIX = _.get(profile, "LINE_PREFIX")

    while (line_index < lines.length) {
      const line = lines[line_index]
      if (_.isUndefined(focused_entity)) {
        const regex = new RegExp(
          `(?<!\`)${profile.marker_prefix}\\$(\\w*)<:([A-Za-z0-9_]+)(.*)`
        )
        // const openTag = line.match(/\$(\w*)<:([A-Za-z0-9_]+)(.*)/);
        const openTag = line.match(regex)
        // TODO: use .exec and apply variable interpolation in the tag as well

        if (openTag) {
          const tag = _.get(openTag, "[1]", "").trim()
          const snippetId = _.get(openTag, "[2]", "").trim()
          let rest = _.get(openTag, "[3]", "").trim()
          rest = rest.replace(
            /([A-Za-z0-9_])+\s*=\s*(_[A-Za-z0-9_]+)/,
            (_full, variable, value) => {
              return `${variable}="${value}"` // TODO: look up global variable. No, the variable interpolation is better
            }
          )
          // console.log(rest)
          let params = {}
          try {
            params = parsePairs.default(rest)
          } catch (e) {
            throw new Error(`${file}:${line_index + 1} invalid parameters`)
          }
          // console.log(params)
          const invalid_params = _.keys(params)
            .filter((key) => _.startsWith(key, "_"))
            .map((e) => `"${e}"`)
            .join(",")

          if (invalid_params) {
            throw new Error(
              `${file}:${line_index} local parameters of a snippet can't start with _ like ${invalid_params}`
            )
          }

          LINE_PREFIX = _.get(params, ["LINE_PREFIX"], LINE_PREFIX)

          const new_snippet = {
            kind: "snippet",
            tag,
            params,
            src: file,
            start: line_index,
            end: line_index,
            template: [],
          }

          _.set(profile, ["snippets", snippetId], new_snippet)

          // console.log(openTag)
          focused_entity = new_snippet
          focused_entity_start_line = line_index
        }
      } else {
        focused_entity.end += 1

        const regex = new RegExp(
          `(?<!\`)${profile.marker_prefix}\\$${focused_entity.tag}>`
        )
        const closeTag = line.match(regex)
        if (closeTag) {
          // const rest = _.get(closeTag, '[1]', '').trim()
          // console.log(closeTag)
          local_entities.push(focused_entity)

          line_index = focused_entity_start_line
          focused_entity = undefined
        } else {
          focused_entity.template.push(line)
        }
      }
      line_index += 1
    }
  })
}
