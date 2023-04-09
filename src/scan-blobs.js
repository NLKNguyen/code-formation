const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const chalk = require("chalk")
const error = require("./error.js")
const common = require("./common.js")
const logger = require("./logger.js")
const colorize = require("json-colorizer")
const source_id = "scan-blobs"

module.exports = async function (files, profile, log) {
  for (let file of files) {
    const content = fs.readFileSync(file, "utf8").trim()
    const lines = content.split(/\r?\n/)
    let line_number = 0
    const local_entities = []
    let focused_entity
    let focused_entity_start_line = 0
    let commonParameters = {
      ...profile.variables,
      ENV: process.env,
      OUT_DIR: profile.OUT_DIR,
      CONTEXT_DIR: ".",
      CURRENT_DIR: file.dirname(),
      CURRENT_FILE: file,
      CURRENT_FILE_NAME: file.basename(),
      CURRENT_FILE_NAME_HASH: file
        .basename()
        .createHash("shake256", { outputLength: 5 }),
      CURRENT_FILE_PATH: file,
      CURRENT_FILE_PATH_HASH: file.createHash("shake256", { outputLength: 5 }),
    }
    while (line_number < lines.length) {
      try {
        let line = lines[line_number]
        if (_.isUndefined(focused_entity)) {
          // const openTag = line.match(/(\s|\w+|@)<&:([A-Za-z0-9_-]+)(.*)/)
          // const openTag = line.match(/(\s|\w+|@)<!(.*)/)
          let openTag
          let doneInterpolation = false
          // let openRegex = new RegExp(
          //   `(?<!\`)${profile.MARKER_PREFIX}!([A-Za-z0-9_]*)<:\\s*([@A-Za-z0-9_]+)?(\\s+[A-Za-z0-9_]+\\s*=\\s*\".*\")?`
          // )
          let openRegex = new RegExp(
            `(?<!\`)${profile.MARKER_PREFIX}!([A-Za-z0-9_]*)<:\\s*([@A-Za-z0-9_]+)?\\s*(\\(.*\\))?`
          )
          // const regex = new RegExp(
          //   `(?<!\`)${profile.MARKER_PREFIX}\\$([A-Za-z0-9_]*)<:([@A-Za-z0-9_]+)\\s*(\\(.*\\))?`
          // )
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
            logger.info(
              `${chalk.cyanBright(
                `scan blob starting on line ${line_number + 1} in`
              )} ${chalk.gray(file)}`
            )
            // console.dir(openTag)
            // const tag = _.get(openTag, "[1]", "").trim()
            const label = _.get(openTag, "[1]", "").trim()
            const command = _.get(openTag, "[2]", "").trim()
            const rest = _.get(openTag, "[3]", "").trim()

            let injection_params = await common.parseParams(rest)
            // console.dir(injection_params)
            // process.exit()

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

              const LINE_BREAK = _.get(
                injection_params,
                ["LINE_BREAK"],
                profile.LINE_BREAK
              )

              const template_str = snippet.template
                .map((e) => LINE_PREFIX + e) // TODO: not really needed
                .join(LINE_BREAK)

              // logger.info(`template_str = ${template_str}`)
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
              // logger.info(`expansion = ${expansion}`)
              lines[line_number] = line.replace(
                openRegex,
                () => `${profile.MARKER_PREFIX}!${label}<:${expansion} `
              )
              logger.info(
                `${chalk.cyan(
                  `expand macro "@${snippet_name}" into marker:`
                )} ${chalk.gray(lines[line_number])}`
              )
              // console.log(lines.join(LINE_BREAK))
              // logger.info(`lines[${line_number}] = ${lines[line_number]}`)
              continue // in next iteration with the same line_number, the macro
              // expansion will be inline to be evaluated like a regular instruction
            }

            // console.log(tag)
            // console.log(rest)
            let params = await common.parseParams(rest)

            let FILE = _.get(params, ["FILE"], "")

            // console.log(FILE)
            // console.log(common.isLocalFilePath(FILE))
            // console.dir(commonParameters)
            // if (common.isLocalFilePath(FILE)) {
              
            //   FILE = './' + path.posix.join(commonParameters.CURRENT_DIR, FILE)
            //   if (FILE.includes("queue")) throw new Error(FILE)
            //   // console.log(FILE)
            //   params.FILE = FILE
            // }

            let ANCHOR = _.get(params, ["ANCHOR"], "")
            let ORDER = _.get(params, ["ORDER"], "")

            let template = []

            let templateAdder = (template, line) => {
              template.push(line)
            }

            if (!_.includes(["WRITE", "PROCESS", "INSERT", "TRANSFORM"], command)) {
              throw new Error(
                `[${source_id}] Missing WRITE, INSERT, or PROCESS command on ${file}:${
                  line_number + 1
                }: ${line}`
              )
            }
            if (command === "PROCESS") {
              params.FILE = ""
            }

            if (command === "INSERT") {
              if (!label) {
                throw new Error(
                  `[${source_id}] missing marker label for in-place INSERT instruction on ${file}:${
                    line_number + 1
                  }: ${line}`
                )
              }

              if (!FILE) {
                throw new Error(
                  `[${source_id}] missing FILE param for in-place INSERT instruction on ${file}:${
                    line_number + 1
                  }: ${line}`
                )
              }

              // the content to be inserted is done via the snippet injection
              // marker in this template
              template = [`$!:INSERT (FILE "${FILE}") (ANCHOR "${ANCHOR}")`]
              // ignore all content within this block because it's supposed to
              // be replace by the INSERT instruction
              templateAdder = (template, line) => {}

              // point the blob output to the current file at the current anchor
              params.FILE = file
              params.ANCHOR = label
            }

            if (command === "TRANSFORM") {
              if (!label) {
                throw new Error(
                  `[${source_id}] missing marker label for TRANSFORM instruction on ${file}:${
                    line_number + 1
                  }: ${line}`
                )
              }

              // point the blob output to the current file at the current anchor
              params.FILE = file
              params.ANCHOR = label
            }

            const new_blob = {
              task: `${FILE}#${ANCHOR}#${ORDER}`,
              // anchor: ANCHOR,
              matched: openTag,
              kind: "blob",
              tag: label,
              params,
              src: file,
              start: line_number,
              end: line_number,
              template,
              templateAdder,
            }
            // console.dir(new_blob)
            // console.log(file)
            // process.exit()
            const tasks = _.get(profile, ["tasks"], [])
            tasks.push(new_blob)
            _.set(profile, ["tasks"], tasks)

            focused_entity = new_blob
            focused_entity_start_line = line_number
          }
        } else {
          focused_entity.end += 1

          // const regex = new RegExp(`${focused_entity.tag}>!(.*)`, "g")
          const regex = new RegExp(
            `(?<!\`)${profile.MARKER_PREFIX}!${focused_entity.tag}>`
          )
          const closeTag = line.match(regex)
          if (closeTag) {
            // const rest = _.get(closeTag, '[1]', '').trim()
            // console.log(closeTag)
            local_entities.push(focused_entity)

            line_number = focused_entity_start_line
            focused_entity = undefined
          } else {
            focused_entity.templateAdder(focused_entity.template, line)
            // focused_entity.template.push(line)
          }
        }
        line_number += 1
      } catch (e) {
        error.message(e, logger)
        throw new Error(
          `[${source_id}] failed to process ${error.message(e, log)}`
        )
      }
    }

    // logger.info(colorize(focused_entity, {pretty: true}))
    // process.exit()
  }
}
