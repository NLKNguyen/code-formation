const htmlEscaper = require("html-escaper")

// const colorize = require("json-colorizer")

// Object.prototype.toPrettyString = function () {  
//   return colorize(this, { pretty: true })
// }


String.prototype.escapeHTML = function () {
  return htmlEscaper.escape(this.valueOf())
}

String.prototype.unescapeHTML = function () {
  return htmlEscaper.unescape(this.valueOf())
}

const crypto = require("crypto")

String.prototype.createHash = function (
  algorithm = "shake256",
  opts = {},
  format = "hex"
) {
  // console.dir({algorithm, opts, format})
  return crypto
    .createHash(algorithm, opts)
    .update(this.valueOf())
    .digest(format)
}

const path = require("path")

String.prototype.dirname = function () {
  return path.dirname(this.valueOf())
}
String.prototype.basename = function () {
  return path.basename(this.valueOf())
}

// String.prototype.extname = function () {
//   return path.extname(this.valueOf())
// }

// String.prototype.filePathWi = function () {
//   return path.basename(this.valueOf())
// }

// String.prototype.extname = function () {
//   const str = this.valueOf()
//   const lastIndex = str.lastIndexOf('.');
//   return str.slice(lastIndex + 1);
// }
