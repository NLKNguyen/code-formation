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
        // const openTag = line.match(/(\s|\w+|@)<&:([A-Za-z0-9_-]+)(.*)/)
        // const openTag = line.match(/(\s|\w+|@)<!(.*)/)
        const regex = new RegExp(`${profile.marker_prefix}!(\\w*)<:(.*)`)

        const openTag = line.match(regex)
        // const openTag = line.match(/!(\w*)<:(.*)/)
        if (openTag) {
          const tag = _.get(openTag, "[1]", "").trim()
          const rest = _.get(openTag, "[2]", "").trim()
          console.log(tag)
          console.log(rest)
          let params = {}
          try {
            params = parsePairs.default(rest)
          } catch (e) {
            console.log("invalid params")
          }

          const new_export = {
            kind: "export",
            tag,
            params,
            src: file,
            start: line_number,
            end: line_number,
            content: [],
          }
          const exports = _.get(profile, ["exports"], [])
          exports.push(new_export)
          _.set(profile, ["exports"], exports)

          // console.log(openTag)
          focused_entity = new_export
          focused_entity_start_line = line_number
        }
      } else {
        focused_entity.end += 1

        // const regex = new RegExp(`${focused_entity.tag}>!(.*)`, "g")
        const regex = new RegExp(
          `${profile.marker_prefix}!${focused_entity.tag}>`
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
