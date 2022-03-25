// const glob = require("glob")
const glob = require("glob-all")
const path = require("path")
const fs = require("fs")
const _ = require("lodash")
const parsePairs = require("parse-pairs")
const colorize = require("json-colorizer")
const chalk = require("chalk")

const scan_snippets = require("./scan-snippets.js")
const scan_exports = require("./scan-exports.js")
const scan_slots = require("./scan-slots.js")
const eval_exports = require("./eval-exports.js")

const Options = require("./options.js")

const profile = {
  marker_prefix: "",
  outdir: "./test-out/",
  newline_char: "\n",
  variables: {},
  snippets: {},
  exports: [],
}

// console.log(parsePairs.default('test=5'))
// const nReadlines = require('n-readlines');

try {
  let { outdir, scan } = Options.read([
    Options.outdir,
    Options.scan,
  ])

  if (!outdir) {
    throw new Error("Missing input argument --outdir")
  }

  if (!scan) {
    throw new Error("Missing input argument --scan")
  }
  scan = scan.split(";").map((e) => e.trim())

  let sourceFiles = glob.sync(scan, { nodir: true }) //`./test/**/*.sql`
  console.log(sourceFiles)

  // scan_variables(sourceFiles, profile)

  scan_snippets(sourceFiles, profile)

  // scan_plugs(sourceFiles, profile)

  // eval_plugs(sourceFiles, profile)

  //   scan_slots(sourceFiles, profile)

  scan_exports(sourceFiles, profile) // scan_slots(sourceFiles, profile)
  console.log(
    colorize(profile, {
      pretty: true,
    })
  )
  eval_exports(sourceFiles, profile)

  // scan_captures(profile)

  // eval_captures(profile)

  // write_exports(profile)

  // console.log(profile)
  console.log(colorize({ outdir, scan }))
} catch (e) {
  console.log(chalk.red(e))
}

// console.log(chalk.blue('test'))

// eval_exports(profile)
// const readline = require('readline');
// const events = require('events');

function parse_snippet_injection(line) {
  const command = line.match(/!&:([A-Za-z0-9_-]+)(.*)/)
  if (command) {
    const id = _.get(command, "[1]", "").trim()
    const rest = _.get(command, "[2]", "").trim()
    const params = parsePairs.default(rest)
    // console.log(id, params)
    return {
      snippet: id,
      params,
    }
  }

  return null
}

function render_snippet(snippet) {
  console.log(snippet)
}
