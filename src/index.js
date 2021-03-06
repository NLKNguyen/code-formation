#!/usr/bin/env node

// const glob = require("glob")
const glob = require("glob-all")
const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const colorize = require("json-colorizer")
const chalk = require("chalk")

const scan_snippets = require("./scan-snippets.js")
const scan_blobs = require("./scan-blobs.js")
// const scan_slots = require("./scan-slots.js")
const eval_blobs = require("./eval-blobs.js")
const write_output = require("./write-output.js")

const Options = require("./options.js")

const winston = require("winston")

const logger = winston.createLogger({
  level: "info",
  // level: "info",
  format: winston.format.json(),
  // defaultMeta: { service: 'user-service' },
  transports: [
    // - Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: "error.log", level: "error" }),

    // - Write all logs with importance level of `info` or less to `combined.log`
    // new winston.transports.File({ filename: 'combined.log' }),
  ],
})

logger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
  })
)

const log = logger

// const log = {
//   info: console.log,
//   error: console.log,
// }

try {
  let { outdir, scan, define } = Options.read([
    Options.outdir,
    Options.scan,
    Options.define,
    // TODO: --definitions <file> for dotenv file
  ])

  // if (!outdir) {
  //   throw new Error("Missing input argument --outdir")
  // }

  if (!scan) {
    throw new Error("Missing input argument --scan")
  }
  // TODO: maybe default to current dir
  scan = scan.split(";").map((e) => e.trim())

  if (!_.isUndefined(define)) {
    try {
      define = parsePairs.default(define)
    } catch (e) {
      throw new Error("Invalid format --define")
    }
  }

  let sourceFiles = glob.sync(scan, { nodir: true })
  log.info(`scanning files: ${colorize(sourceFiles, { pretty: true })}`)

  const profile = {
    marker_prefix: "",
    variables: {},
    snippets: {},
    exports: [],
    OUTDIR: outdir,
    LINE_FEED: "\n",
    LINE_PREFIX: "0", // can be literal string or number, which is offset indentation from the tag marker
    SECTION_SEPARATOR: "\n",
  }

  if (!_.isUndefined(define)) {
    profile.variables = define
  }
  // log.info(
  //   colorize(profile, {
  //     pretty: true,
  //   })
  // )
  // scan_variables(sourceFiles, profile)

  scan_snippets(sourceFiles, profile, log)

  // scan_plugs(sourceFiles, profile)

  // eval_plugs(sourceFiles, profile)

  //   scan_slots(sourceFiles, profile)

  scan_blobs(sourceFiles, profile, log) // scan_slots(sourceFiles, profile)

  eval_blobs(sourceFiles, profile, log)

  write_output(sourceFiles, profile, log)

  // log.verbose(
  //   colorize(profile, {
  //     pretty: true,
  //   })
  // )

  // scan_captures(profile)
  // eval_captures(profile)
  // write_exports(profile)
  // log.info(profile)
  // log.info(colorize({ outdir, scan }))
} catch (e) {
  log.info()
  log.error(chalk.red(e))
}

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
