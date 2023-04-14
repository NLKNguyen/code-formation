const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const chalk = require("chalk")

const SExpr = require("s-expression.js")
const common = require("./common")

const logger = require("./logger")
const colorize = require("json-colorizer")

module.exports = async function (files, profile, log) {
  for (let file of files) {
    logger.info(`${chalk.magenta(`scan CFL script`)} ${chalk.gray(file)}`)

    const content = fs.readFileSync(file, "utf8").trim()

    const S = new SExpr()

    await S.interpret(S.parse(content, { includedRootParentheses: false }), {
      handlers: {
        DEF: {
          notation: null,
          evaluate: async (components, context, state, entity) => {
            const throwGenericException = () => {
              throw Error(
                `Invalid CFL syntax: "(def ${JSON.stringify(
                  S.serialize(components, {
                    includingRootParentheses: false,
                  })
                )})" \nExpected: "(def [NAME] [VALUE])"`
              )
            }

            if (components.length !== 2) {
              throwGenericException()
            }
            const name = S.first(components)
            if (!S.isAtom(name)) {
              throwGenericException()
            }

            logger.info(
              `${chalk.cyan(`defined variable`)} ${chalk.green(name)}`
            )

            if (_.includes(["variables", "snippets", "exports", "tasks"], name)) {
              throw Error("can't use reserved name")
            }
            const value = S.valueOf(S.second(components))

            // logger.info(
            //   `${chalk.cyan(`define variable`)} ${chalk.green(
            //     name
            //   )} ${chalk.cyan(`as`)} ${chalk.green(JSON.stringify(value))} `
            // )            
            _.set(profile, name, value)
            return true // not needed
          },
        },

        DEFMACRO: {
          notation: null,
          evaluate: async (components, context, state, entity) => {
            const throwGenericException = () => {
              throw Error(
                `Invalid CFL syntax: "(defmacro ${JSON.stringify(
                  S.serialize(components, {
                    includingRootParentheses: false,
                  })
                )})" \nExpected: "(defmacro ([NAME] [PARAMS]) ([EXPANSION]))"`
              )
            }

            if (components.length !== 2) {
              throwGenericException()
            }
            const macro = S.first(components)
            const expansion = S.serialize(S.second(components), {
              includingRootParentheses: false,
            })

            const name = S.first(macro)
            if (!S.isAtom(name)) {
              throwGenericException()
            }

            const rest = S.serialize(S.rest(macro), {
              includingRootParentheses: false,
            })

            let params = await common.parseParams(rest)

            logger.info(`${chalk.cyan(`defined macro`)} ${chalk.green(name)}`)

            let LANGUAGE = _.get(params, "LANGUAGE", "ejs")
            _.set(params, "LANGUAGE", LANGUAGE)

            const new_snippet = {
              kind: "snippet",
              tag: "",
              params,
              src: file,
              start: 0,
              end: 0,
              template: expansion.split("\n"),
              custom: {},
            }

            // logger.info(colorize(new_snippet, { pretty: true }))
            _.set(profile, ["snippets", name], new_snippet)

            return true // not needed
          },
        },
      },
    })

    // console.dir(profile)
  }
}
