const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const chalk = require("chalk")

const source_id = "scan-blobs"

module.exports = function (files, profile) {
  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8").trim()
    const lines = content.split(/\r?\n/)
    let line_number = 0
    const local_entities = []
    let focused_entity
    let focused_entity_start_line = 0
    while (line_number < lines.length) {
      try {
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
            // console.log(tag)
            // console.log(rest)
            let params = {}
            try {
              params = parsePairs.default(rest)
            } catch (e) {
              console.log("invalid params")
            }

            const ORDER = _.get(params, ["ORDER"], "")
            
            const new_blob = {
              task: `${file}#${ORDER}`,
              kind: "blob",
              tag,
              params,
              src: file,
              start: line_number,
              end: line_number,
              template: [],
            }
            const tasks = _.get(profile, ["tasks"], [])
            tasks.push(new_blob)
            _.set(profile, ["tasks"], tasks)

            // const tasks = _.get(profile, "tasks", [])
            // tasks.push({
            //   blob: {
            //     path:  blob_path,
            //     order: `#${_.get(params, ["ORDER"])}`
            //   }
            // })
            // _.set(profile, "tasks", tasks)

            // console.log(openTag)
            focused_entity = new_blob
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
            focused_entity.template.push(line)
          }
        }
        line_number += 1
      } catch (e) {
        // function dumpError(err) {
        //   if (typeof err === "object") {
        //     if (err.message) {
        //       console.log("\nMessage: " + err.message)
        //     }
        //     if (err.stack) {
        //       console.log("\nStacktrace:")
        //       console.log("====================")
        //       console.log(err.stack)
        //     }
        //   } else {
        //     console.log("dumpError :: argument is not an object")
        //   }
        // }

        // dumpError(e)

        var error_line = e.stack.split("\n")[1]
        console.error(chalk.red(e.message) + "\n" + chalk.cyanBright(`${error_line}`))
        throw new Error(`[${source_id}] failed to process ${file}`)
      }
    }
  })
}
