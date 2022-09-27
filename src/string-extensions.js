const htmlEscaper = require("html-escaper")

String.prototype.escapeHTML = function () {
  return htmlEscaper.escape(this.valueOf())
}

String.prototype.unescapeHTML = function () {
  return htmlEscaper.unescape(this.valueOf())
}

const crypto = require("crypto")

String.prototype.createHash = function (
  algorithm = "shake256",
  outputLength = 5,
  format = "hex"
) {
  return crypto
    .createHash(algorithm, { outputLength })
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
