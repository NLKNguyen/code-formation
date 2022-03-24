const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")

module.exports = function (files, profile) {
  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8").trim()
    const lines = content.split(/\r?\n/)
    let line_number = 0
    const local_entities = []
    let focused_entity
    let focused_entity_start_line = 0
    while (line_number < lines.length) {
      const line = lines[line_number]
      if (_.isUndefined(focused_entity)) {
        const regex = new RegExp(
          `${profile.marker_prefix}\\$(\\w*)<:([A-Za-z0-9_]+)(.*)`
        )
        // const openTag = line.match(/\$(\w*)<:([A-Za-z0-9_]+)(.*)/);
        const openTag = line.match(regex)
        if (openTag) {
          const tag = _.get(openTag, "[1]", "").trim()
          const snippetId = _.get(openTag, "[2]", "").trim()
          let rest = _.get(openTag, "[3]", "").trim()
          rest = rest.replace(
            /([A-Za-z0-9_])+\s*=\s*(_[A-Za-z0-9_]+)/,
            (_full, variable, value) => {
              return `${variable}="${value}"` // TODO: look up global variable
            }
          )
          console.log(rest)
          let params = {}
          try {
            params = parsePairs.default(rest)
            console.log(params)
          } catch (e) {
            console.log("invalid params")
          }

          const invalid_params = _.keys(params)
            .filter((key) => _.startsWith(key, "_"))
            .map((e) => `"${e}"`)
            .join(",")

          if (invalid_params) {
            throw new Error(
              `${file}:${line_number} local parameters of a snippet can't start with _ like ${invalid_params}`
            )
          }

          const new_snippet = {
            kind: "snippet",
            tag,
            params,
            src: file,
            start: line_number,
            end: line_number,
            content: [],
          }
          _.set(profile, ["snippets", snippetId], new_snippet)
          snippetId
          // console.log(openTag)
          focused_entity = new_snippet
          focused_entity_start_line = line_number
        }
      } else {
        focused_entity.end += 1

        const regex = new RegExp(
          `${profile.marker_prefix}\\$${focused_entity.tag}>`
        )
        const closeTag = line.match(regex)
        if (closeTag) {
          // const rest = _.get(closeTag, '[1]', '').trim()
          // console.log(closeTag)
          local_entities.push(focused_entity)

          line_number = focused_entity_start_line
          focused_entity = undefined
        } else {
          focused_entity.content.push(line)
        }
      }
      line_number += 1
    }
  })
}
