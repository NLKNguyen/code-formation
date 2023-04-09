const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const chalk = require("chalk")
const {VM} = require('vm2');

const common = require("./common")

const logger = require("./logger")
const colorize = require("json-colorizer")
const source_id = "scan-snippets"

module.exports = async function (files, profile, log) {
  for (let file of files) {
    const content = fs.readFileSync(file, "utf8").trim()
    const lines = content.split(/\r?\n/)
    let line_index = 0
    // const local_entities = []
    let focused_entity
    let focused_entity_start_line = 0
    let LINE_PREFIX = _.get(profile, "LINE_PREFIX")

    while (line_index < lines.length) {
      const line = lines[line_index]
      if (_.isUndefined(focused_entity)) {
        // const regex = new RegExp(
        //   `(?<!\`)${profile.MARKER_PREFIX}\\$(\\w*)<:([A-Za-z0-9_]+)(.*)`
        // )

        // const regex = new RegExp(
        //   `(?<!\`)${profile.MARKER_PREFIX}\\$(\\w*)<:([A-Za-z0-9_]+)(\\s*\\(.*\\))`
        // )

        // const openTag = line.match(/\$(\w*)<:([A-Za-z0-9_]+)(.*)/);
        const regex = new RegExp(
          `(?<!\`)${profile.MARKER_PREFIX}\\$([A-Za-z0-9_]*)<:\\s*([@A-Za-z0-9_]+)\\s*(\\(.*\\))?`
        )

        const openTag = line.match(regex)
        // TODO: use .exec and apply variable interpolation in the tag as well

        if (openTag) {
          // console.dir(openTag)
          // process.exit()
          const tag = _.get(openTag, "[1]", "").trim()
          const snippetId = _.get(openTag, "[2]", "").trim()

          logger.info(
            `${chalk.magenta(
              `scan snippet "${snippetId}" starting on line ${
                line_index + 1
              } in`
            )} ${chalk.gray(file)}`
          )
          let rest = _.get(openTag, "[3]", "").trim()

          // console.dir(rest)
          let params = await common.parseParams(rest)
          // console.dir({params})
          // process.exit()
          // console.dir({
          //   tag,
          //   snippetId,
          //   rest,
          //   ast,
          // })
          // logger.info(colorize(params, { pretty: true }))
          // process.exit()
          // rest = rest.replace(
          //   /([A-Za-z0-9_])+\s*=\s*(_[A-Za-z0-9_]+)/,
          //   (_full, variable, value) => {
          //     return `${variable}="${value}"` // TODO: look up global variable. No, the variable interpolation is better
          //   }
          // )
          // console.log(rest)

          // try {
          //   params = parsePairs.default(rest)
          // } catch (e) {
          //   throw new Error(`${file}:${line_index + 1} invalid parameters`)
          // }
          // // console.log(params)
          // const invalid_params = _.keys(params)
          //   .filter((key) => _.startsWith(key, "_"))
          //   .map((e) => `"${e}"`)
          //   .join(",")

          // if (invalid_params) {
          //   throw new Error(
          //     `${file}:${line_index} local parameters of a snippet can't start with _ like ${invalid_params}`
          //   )
          // }

          let LANGUAGE = _.get(params, "LANGUAGE", "ejs")
          _.set(params, "LANGUAGE", LANGUAGE)

          LINE_PREFIX = _.get(params, ["LINE_PREFIX"], LINE_PREFIX)

          const new_snippet = {
            kind: "snippet",
            tag,
            params,
            src: file,
            start: line_index,
            end: line_index,
            template: [],            
            custom: {}
          }

          _.set(profile, ["snippets", snippetId], new_snippet)
          // console.log(new_snippet)
          // process.exit()
          // console.log(openTag)
          focused_entity = new_snippet
          focused_entity_start_line = line_index
        }
      } else {
        focused_entity.end += 1

        const regex = new RegExp(
          `(?<!\`)${profile.MARKER_PREFIX}\\$${focused_entity.tag}>`
        )
        const closeTag = line.match(regex)
        if (closeTag) {
          // const rest = _.get(closeTag, '[1]', '').trim()
          // console.log(closeTag)

          // let LANGUAGE = _.get(focused_entity.params, "LANGUAGE[0]", "ejs")
          // // console.dir(focused_entity)
          // if (LANGUAGE === "js") {
          //   const script = focused_entity.template.join("\n")
          //   // console.log(script)

            
          //   const vm = new VM({
          //     timeout: 1000,
          //     allowAsync: true,
          //     sandbox: {}
          //   });

          //   const result = await vm.run(`
          //   async function hello() {
          //     async function test() {
          //       return "test"
          //     }
          //     return "abc " + await test()
          //   }
          //   (async () => {
          //     return await hello()
          //   })()
            
          //   `); 
          //   console.log(result)
          // }

          // local_entities.push(focused_entity) // unused

          line_index = focused_entity_start_line
          focused_entity = undefined
        } else {
          focused_entity.template.push(line)
        }
      }
      line_index += 1
    }
  }
}
