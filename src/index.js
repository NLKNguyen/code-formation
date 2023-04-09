#!/usr/bin/env node

require("./string-extensions.js")

// const glob = require("glob")
const glob = require("glob-all")
const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const colorize = require("json-colorizer")
const chalk = require("chalk")
const booleanParser = require("boolean")
// const ora = require("ora")
// const xmlescape = require('xml-escape');

const wcmatch = require("wildcard-match")

const scan_scripts = require("./scan-scripts.js")
const scan_snippets = require("./scan-snippets.js")
const scan_blobs = require("./scan-blobs.js")
// const scan_slots = require("./scan-slots.js")
const eval_blobs = require("./eval-blobs.js")
const write_output = require("./write-output.js")

const Options = require("./options.js")

const common = require("./common.js")
const error = require("./error.js")
const logger = require("./logger.js")

// const winston = require("winston")

// const logger = winston.createLogger({
//   level: "info",
//   // level: "info",
//   format: winston.format.json(),
//   // defaultMeta: { service: 'user-service' },
//   transports: [
//     // - Write all logs with importance level of `error` or less to `error.log`
//     new winston.transports.File({ filename: "error.log", level: "error" }),

//     // - Write all logs with importance level of `info` or less to `combined.log`
//     // new winston.transports.File({ filename: 'combined.log' }),
//   ],
// })

// logger.add(
//   new winston.transports.Console({
//     format: winston.format.simple(),
//   })
// )

// const log = logger
// const log = {
//   info: console.log,
//   error: console.log,
// }

// console.log('<xml>'.escapeXML('abc'))
;(async function () {
  try {
    let { outdir, scan, define } = Options.read([
      Options.outdir,
      Options.scan,
      // Options.define,
      // TODO: --definitions <file> for dotenv file
    ])

    scan = [
      ".code-formation/**",
      ...scan.split(",").map((e) => e.trim()),
    ].filter(Boolean)

    let sourceFiles = []
    for (let p of glob.sync(scan)) {
      if (fs.lstatSync(p).isDirectory()) {
        glob
          .sync([`${p}/.code-formation/**`])
          .filter((e) => fs.lstatSync(e).isFile())
          .forEach((e) => sourceFiles.push(e))
      } else {
        sourceFiles.push(p)
      }
    }

    // if (!_.isUndefined(define)) {
    //   try {
    //     define = parsePairs.default(define)
    //   } catch (e) {
    //     throw new Error("Invalid format --define")
    //   }
    // }

    // let sourceFiles = glob.sync(scan, { nodir: true })
    logger.info(
      `${chalk.gray(`scanning files:`)} ${colorize(sourceFiles, {
        pretty: true,
      })}`
    )

    const isCflFile = wcmatch("**/.code-formation/*.cfl")

    const cflFiles = sourceFiles.filter(isCflFile)

    if (cflFiles.length > 0) {
      logger.info(
        `${chalk.gray(`detected CFL scripts:`)} ${colorize(cflFiles, {
          pretty: true,
        })}`
      )
      await scan_scripts(cflFiles, common.profile, logger)
    }

    // if (!_.isUndefined(define)) {
    //   common.profile.variables = define
    // }
    // logger.info(
    //   colorize(profile, {
    //     pretty: true,
    //   })
    // )
    // scan_variables(sourceFiles, profile)

    common.profile.OUT_DIR = outdir
    // console.dir(common.profile)

    await scan_snippets(sourceFiles, common.profile, logger)

    // console.log(profile.snippets)
    // process.exit()
    // scan_plugs(sourceFiles, profile)

    // eval_plugs(sourceFiles, profile)

    //   scan_slots(sourceFiles, profile)

    await scan_blobs(sourceFiles, common.profile, logger) // scan_slots(sourceFiles, profile)

    await eval_blobs(sourceFiles, common.profile, logger)

    await write_output(sourceFiles, common.profile, logger)

    // logger.verbose(
    //   colorize(profile, {
    //     pretty: true,
    //   })
    // )

    // scan_captures(profile)
    // eval_captures(profile)
    // write_exports(profile)
    // logger.info(profile)
    // logger.info(colorize({ outdir, scan }))
  } catch (e) {
    // logger.info()

    // logger.error(chalk.red(e))
    error.message(e, logger)
    // console.error(e)
    process.exit(1)
  }
})()
// // console.log(chalk.blue('test'))

// // eval_blobs(profile)
// // const readline = require('readline');
// // const events = require('events');

// function parse_snippet_injection(line) {
//   const command = line.match(/!&:([A-Za-z0-9_-]+)(.*)/)
//   if (command) {
//     const id = _.get(command, "[1]", "").trim()
//     const rest = _.get(command, "[2]", "").trim()
//     const params = parsePairs.default(rest)
//     // console.log(id, params)
//     return {
//       snippet: id,
//       params,
//     }
//   }

//   return null
// }

// function render_snippet(snippet) {
//   console.log(snippet)
// }
