const winston = require("winston")
const luxon = require("luxon")
const path = require("path")
const PROJECT_ROOT = path.join(__dirname, "..")
// console.log(PROJECT_ROOT)
// process.exit()
const logger = winston.createLogger({
  level: "verbose",
  // level: "info",
  format: winston.format.json(),
  // defaultMeta: { service: 'user-service' },
  // transports: [
  //   // - Write all logs with importance level of `error` or less to `error.log`
  //   new winston.transports.File({ filename: "error.log", level: "error" }),

  //   // - Write all logs with importance level of `info` or less to `combined.log`
  //   // new winston.transports.File({ filename: 'combined.log' }),
  // ],
})

logger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
    timestamp: function () {
      return luxon.DateTime.now().toFormat("DD-MM-YYYY h:mm:ssa")
    },
  })
)

if (process.env.NODE_ENV === "production") {
  logger.transports.console.level = "info"
}
if (process.env.NODE_ENV === "development") {
  logger.transports.console.level = "debug"
}

module.exports.info = function () {
  logger.info.apply(logger, formatLogArguments(arguments))
}
module.exports.log = function () {
  logger.log.apply(logger, formatLogArguments(arguments))
}
module.exports.warn = function () {
  logger.warn.apply(logger, formatLogArguments(arguments))
}
module.exports.debug = function () {
  logger.debug.apply(logger, formatLogArguments(arguments))
}
module.exports.verbose = function () {
  logger.verbose.apply(logger, formatLogArguments(arguments))
}

module.exports.error = function () {
  logger.error.apply(logger, formatLogArguments(arguments))
}

function formatLogArguments(args) {
  args = Array.prototype.slice.call(args)
  const stackInfo = getStackInfo(1)

  if (stackInfo) {
    const calleeStr = `(${stackInfo.relativePath}:${stackInfo.line})`
    if (typeof args[0] === "string") {
      args[0] = args[0] + " " + calleeStr
    } else {
      args.unshift(calleeStr)
    }
  }
  return args
}

function getStackInfo(stackIndex) {
  const stacklist = new Error().stack.split("\n").slice(3)
  // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
  // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
  const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
  const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

  const s = stacklist[stackIndex] || stacklist[0]
  const sp = stackReg.exec(s) || stackReg2.exec(s)

  if (sp && sp.length === 5) {
    return {
      method: sp[1],
      relativePath: path.relative(PROJECT_ROOT, sp[2]),
      line: sp[3],
      pos: sp[4],
      file: path.basename(sp[2]),
      stack: stacklist.join("\n"),
    }
  }
}

logger.exitOnError = false
