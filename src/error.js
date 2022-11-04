const chalk = require("chalk")
const colorize = require("json-colorizer")

module.exports = {
  message: function (exception, logger) {
    // TODO: clean this up, use LoggerFactory, etc.
    const error_line = exception.stack.split("\n")[1]
    logger.error(
      chalk.red(exception.message)  + "\n" + chalk.gray(` ${error_line.trim()}\n`)
    )    
  },
}

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
