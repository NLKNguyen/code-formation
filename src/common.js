const _ = require("lodash")
const fs = require("fs")
const crypto = require("crypto")

function createHash(data, len=5) {
  return crypto.createHash("shake256", { outputLength: len })
    .update(data)
    .digest("hex");
}

function makePrefixString(prefix, line, index) {
  const offset = parseInt(prefix)
  if (isNaN(offset)) {
    return prefix
  } else {
    if (offset <= 0) {
      prefix = line.substring(0, index + offset)
    } else {
      let indent_char = " "
      if (index > 0) {
        indent_char = line.substring(index - 1, index)
      }
      prefix = line.substring(0, index) + indent_char.repeat(offset)
    }

    return prefix
  }
}

function renderTemplate(
  template,
  variables,
  options = { interpolate: "default" }
) {
  let interpolate
  switch (options.interpolate) {
    default:
      interpolate = /<%=([\s\S]+?)%>/g
  }

  const compiled_template = _.template(template, { interpolate })
  const rendered = compiled_template(variables)
  return rendered
}

function writeFileSyncRecursive(filename, content, charset) {
  // -- normalize path separator to '/' instead of path.sep,
  // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
  let filepath = filename.replace(/\\/g, "/")

  // -- preparation to allow absolute paths as well
  let root = ""
  if (filepath[0] === "/") {
    root = "/"
    filepath = filepath.slice(1)
  } else if (filepath[1] === ":") {
    root = filepath.slice(0, 3) // c:\
    filepath = filepath.slice(3)
  }

  // -- create folders all the way down
  const folders = filepath.split("/").slice(0, -1) // remove last item, file
  folders.reduce(
    (acc, folder) => {
      const folderPath = acc + folder + "/"
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
      }
      return folderPath
    },
    root // first 'acc', important
  )

  // -- write file
  fs.writeFileSync(root + filepath, content, charset)
}

function isOnlyOneDefined(arr) {
  return  _.sum(arr, e => _.isUndefined(e) ? 0 : 1) === 1
}

function hasTemplateInstruction(profile, line) {  
  const snippetOpenRegex = new RegExp(
    `(?<!\`)${profile.marker_prefix}\\$(\\w*)<:([A-Za-z0-9_]+)(.*)`
  )
  
  if (snippetOpenRegex.exec(line)) {
    return true
  }

  const snippetCloseRegex = new RegExp(
    `(?<!\`)${profile.marker_prefix}\\$(\\w*)>`
  )
  if (snippetCloseRegex.exec(line)) {
    return true
  }

  const blobOpenRegex = new RegExp(
    `(?<!\`)${profile.marker_prefix}!(\\w*)<:(.*)`
  )
  
  if (blobOpenRegex.exec(line)) {
    return true
  }

  const blobCloseRegex = new RegExp(
    `(?<!\`)${profile.marker_prefix}!(\\w*)>`
  )
  
  if (blobCloseRegex.exec(line)) {
    return true
  }

  return false
}

module.exports = {
  createHash,
  makePrefixString,
  renderTemplate,
  writeFileSyncRecursive,
  isOnlyOneDefined,
  hasTemplateInstruction
}
