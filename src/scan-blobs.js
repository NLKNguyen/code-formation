const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const chalk = require("chalk")
const error = require("./error.js")
const common = require("./common.js")

const source_id = "scan-blobs"

module.exports = function (files, profile, log) {
  files.forEach((src) => {
    const content = fs.readFileSync(src, "utf8").trim()
    const lines = content.split(/\r?\n/)
    let line_number = 0
    const local_entities = []
    let focused_entity
    let focused_entity_start_line = 0
    let commonParameters = {
      ...profile.variables,
      OUT_DIR: profile.OUT_DIR,
      CONTEXT_DIR: ".",
      CURRENT_DIR: src.dirname(),
      CURRENT_FILE: src,
      CURRENT_FILE_NAME: src.basename(),
      CURRENT_FILE_NAME_HASH: src.basename().createHash(),
      CURRENT_FILE_PATH: src,
      CURRENT_FILE_PATH_HASH: src.createHash(),
    }
    while (line_number < lines.length) {
      try {
        let line = lines[line_number]
        if (_.isUndefined(focused_entity)) {
          // const openTag = line.match(/(\s|\w+|@)<&:([A-Za-z0-9_-]+)(.*)/)
          // const openTag = line.match(/(\s|\w+|@)<!(.*)/)
          let openTag
          let doneInterpolation = false
          let openRegex = new RegExp(
            `(?<!\`)${profile.marker_prefix}!([A-Za-z0-9_]*)<:\\s*([@A-Za-z0-9_]+)?(\\s+[A-Za-z0-9_]+\\s*=\\s*\".*\")?`
          )
          while (true) {
            openTag = openRegex.exec(line)

            if (!openTag || doneInterpolation) {
              break
            } else {
              line = common.renderTemplate(line, {
                ...commonParameters,
              })
              // console.log(line)
              doneInterpolation = true
            }
          }
          // const openTag = line.match(regex)
          // const openTag = line.match(/!(\w*)<:(.*)/)
          if (openTag) {
            log.info(
              `${chalk.cyanBright(
                `scan blob starting on line ${line_number + 1} in`
              )} ${chalk.gray(src)}`
            )
            // console.dir(openTag)
            // const tag = _.get(openTag, "[1]", "").trim()
            const label = _.get(openTag, "[1]", "").trim()
            const command = _.get(openTag, "[2]", "").trim()
            const rest = _.get(openTag, "[3]", "").trim()

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

            if (command.startsWith("@")) {
              const snippet_name = command.split("@")[1]

              const snippet = _.get(profile, ["snippets", snippet_name])
              if (_.isUndefined(snippet)) {
                //  && !_.includes(["PASSTHROUGH"], command)
                throw new Error(
                  `[${source_id}] cannot find the snippet "${snippet_name}" for macro expansion`
                )
              }

              const merged_params = _.merge(
                // {},
                { ...commonParameters },
                snippet.params,
                injection_params
              )

              let LINE_PREFIX = _.get(
                injection_params,
                ["LINE_PREFIX"],
                _.get(profile, "LINE_PREFIX")
              )

              const LINE_FEED = _.get(
                injection_params,
                ["LINE_FEED"],
                profile.LINE_FEED
              )

              const template_str = snippet.template
                .map((e) => LINE_PREFIX + e) // TODO: not really needed
                .join(LINE_FEED)

              // log.info(`template_str = ${template_str}`)
              const macro = common
                .renderTemplate(template_str, merged_params)
                .split(/\r?\n/)
                .filter(Boolean)
              let macroLines = []
              let hasPreviousTrailingSpace = true
              for (let line of macro) {
                let hasLeadingSpace = line.startsWith(" ")
                if (!hasPreviousTrailingSpace && !hasLeadingSpace) {
                  macroLines.push(" " + line)
                } else {
                  macroLines.push(line)
                }
                hasPreviousTrailingSpace = line.endsWith(" ")
              }
              const expansion = macroLines.join("")
              // log.info(`expansion = ${expansion}`)
              lines[line_number] = line.replace(
                openRegex,
                () => `${profile.marker_prefix}!${label}<:${expansion}`
              )
              log.info(
                `${chalk.cyan(
                  `expand macro "@${snippet_name}" into marker:`
                )} ${chalk.gray(lines[line_number])}`
              )
              // console.log(lines.join(LINE_FEED))
              // log.info(`lines[${line_number}] = ${lines[line_number]}`)
              continue // in next iteration with the same line_number, the macro
              // expansion will be inline to be evaluated like a regular instruction
            }

            // console.log(tag)
            // console.log(rest)
            let params = {}
            try {
              params = parsePairs.default(rest)
            } catch (e) {
              throw new Error(error.message(e, log))
            }

            if (!_.includes(["WRITE", "PROCESS"], command)) {
              throw new Error(
                `[${source_id}] Missing WRITE or PROCESS command on ${src}:${
                  line_number + 1
                }: ${line}`
              )
            }
            if (command === "PROCESS") {
              params.FILE = ""
            }

            const ANCHOR = _.get(params, ["ANCHOR"], "")
            const ORDER = _.get(params, ["ORDER"], "")

            const new_blob = {
              task: `${src}#${ANCHOR}#${ORDER}`,
              // anchor: ANCHOR,
              matched: openTag,
              kind: "blob",
              tag: label,
              params,
              src: src,
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
            `(?<!\`)${profile.marker_prefix}!${focused_entity.tag}>`
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
        throw new Error(
          `[${source_id}] failed to process ${error.message(e, log)}`
        )
      }
    }
  })
}
