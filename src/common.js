const _ = require("lodash")
const fs = require("fs")
const crypto = require("crypto")
const SExpr = require("s-expression.js")
const requireg = require("requireg")
const { NodeVM, VM, VMScript } = require("vm2")
const logger = require("./logger")
const fetch = require("node-fetch")

const marked = require("marked") // Markdown parser
const cheerio = require("cheerio") // jQuery for Node
const chalk = require("chalk") // Colorful console log

const profile = {
  MARKER_PREFIX: "",
  variables: {},
  snippets: {},
  exports: [],
  // OUT_DIR: outdir,
  LINE_BREAK: "\n",
  LINE_PREFIX: "", // can be literal string or number, which is offset indentation from the tag marker
  SECTION_SEPARATOR: "\n",
  CONTINUOUS_EMPTY_LINES: 1,
  // plugins,
  // libraries: {
  //   common,
  //   lodash: _,
  //   chalk,
  //   fs,
  //   booleanParser,
  // },
}

const modules = {
  fetch,
  marked,
  cheerio,
  chalk,
  URLSearchParams: URLSearchParams,
}

async function invoke(snippet, context) {
  // let snippet = _.get(profile, ["snippets", snippetName])
  // // console.log(profile)
  // if (_.isUndefined(snippet)) {
  //   //  && !_.includes(["PASSTHROUGH"], command)
  //   throw new Error(
  //     `[${source_id}] cannot find the snippet "${snippet_name}"`
  //   )
  // }
  const LANGUAGE = _.get(context, "LANGUAGE")
  const LINE_BREAK = _.get(context, "LINE_BREAK")
  // console.dir({template: snippet.template, LANGUAGE, LINE_BREAK})
  const template = snippet.template.join(LINE_BREAK)

  let result = ""
  if (LANGUAGE == "ejs") {
    result = renderTemplate(template, context)
    // console.dir({
    //   snippet,
    //   template,
    //   context,
    //   result,
    // })

    // process.exit()
  } else if (LANGUAGE === "nodejs") {
    let script = _.get(snippet, ["custom", "precompiled"])

    // console.dir({ template })
    // process.exit()
    if (!script) {
      script = new VMScript(template).compile()
      _.set(snippet, ["custom", "precompiled"], script) // cache to avoid recompiling
    }

    const vm = new NodeVM({
      allowAsync: true,
      require: {
        external: true,
        root: "./",
        builtin: ["*"],
      },
      env: process.env,
      // argv: process.argv,
      // wrapper: false,
      sandbox: {
        ...context,
        requireg,
        _common: module.exports /* this same module */,
        _logger: logger,
        _: _,
      },
    })
    const func = vm.run(script)
    // console.log(func)
    result = await func(context)
    // console.log(result)
  } else {
    throw new Error(`Unsupported LANGUAGE '${LANGUAGE}'`)
  }

  return result
}

function serializeMacro(macro) {
  const S = new SExpr()
  const ast = S.parse(macro, { includedRootParentheses: false })
  // console.dir(ast)
  // process.exit()
  return S.serialize(ast, { includingRootParentheses: false })
}

async function parseParams(str) {
  const S = new SExpr()

  // console.log(str)

  S.defaults[S.FUNCTION] = {
    evaluate: async (data, context, state, entity) => {
      if (data.length > 1) {
        throw new Error(`'${entity}' can take no more than 1 argument.`)
      }
      // return { [entity]: S.first(data) }
      return { [entity]: data[0] }
    },
  }

  S.defaults["LIST"] = {
    evaluate: async (data, context, state, entity) => {
      const result = data
      // console.dir(result)
      return result
    },
  }

  S.defaults[S.ROOT] = {
    evaluate: async (data, context, state, entity) => {
      const result = _.merge({}, ...data)
      // console.dir(result)
      return result
    },
  }

  // console.dir(S.defaults)
  // process.exit()

  // const filtersDefaults = { ...S.defaults }
  // filtersDefaults[S.FUNCTION] = {
  //   evaluate: async (data, context, state, entity) => {
  //     return { [entity]: data }
  //   },
  // }

  // S.defaults[S.ROOT] = {
  //   evaluate: async (data, context, state, entity) => {
  //     const result = _.merge({}, ...data)
  //     // console.dir(result)
  //     return result
  //   },
  // }

  return await S.interpret(S.parse(str, { includedRootParentheses: false }), {
    handlers: {
      APPLY: {
        evaluate: async (components, context, state, entity) => {
          return { [entity]: components }
        },
        handlers: {
          [S.FUNCTION]: {
            evaluate: async (components, context, state, entity) => {
              const params = _.merge({}, ...components)
              // console.dir({params})
              // console.dir({ [entity]: params })

              // for(let component of data) {
              //   let key = Object.keys(component)[0]
              //   let value = component[key]
              //   console.dir({key, value})

              //   console.dir({key, params})
              // }
              // console.dir({ [entity]: params })
              // process.exit()
              return { [entity]: params }
              // return { [entity]: data }
            },
            // handlers: {
            //   [S.FUNCTION]: {
            //     evaluate: async (data, context, state, entity) => {
            //       console.dir({ [entity]: data[0] })
            //       process.exit()
            //       return { [entity]: data }
            //     },
            //   },
            // },
          },
        },
        // defaults: filtersDefaults,
      },
    },
  })
}

function createHash(str, algorithm = "shake256", opts = {}, format = "hex") {
  // console.dir({algorithm, opts, format})
  return crypto.createHash(algorithm, opts).update(str).digest(format)
}

// function createHash(data, len = 5) {
//   return crypto
//     .createHash("shake256", { outputLength: len })
//     .update(data)
//     .digest("hex")
// }

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
  return _.sum(arr, (e) => (_.isUndefined(e) ? 0 : 1)) === 1
}

function hasTemplateInstruction(profile, line) {
  // TODO: snippet block
  // TODO: anchor block
  const snippetOpenRegex = new RegExp(
    `(?<!\`)${profile.MARKER_PREFIX}\\$(\\w*)<:([A-Za-z0-9_]+)(.*)`
  )

  if (snippetOpenRegex.exec(line)) {
    return true
  }

  const snippetCloseRegex = new RegExp(
    `(?<!\`)${profile.MARKER_PREFIX}\\$(\\w*)>`
  )
  if (snippetCloseRegex.exec(line)) {
    return true
  }

  const blobOpenRegex = new RegExp(
    `(?<!\`)${profile.MARKER_PREFIX}!(\\w*)<:(.*)`
  )

  if (blobOpenRegex.exec(line)) {
    return true
  }

  const blobCloseRegex = new RegExp(`(?<!\`)${profile.MARKER_PREFIX}!(\\w*)>`)

  if (blobCloseRegex.exec(line)) {
    return true
  }

  return false
}

/**
 * Check if a path is a local file path, meaning that not have prefix . nor absolute path
 * @param {string} path to check if it's a local file path
 * @returns
 */
function isLocalFilePath(path) {
  return path && !/(^\.\/)|(^\.\\)|(^\/)|(^[^:\s]+:)/.test(path)
}

module.exports = {
  modules,
  profile,
  logger,
  invoke,
  parseParams,
  serializeMacro,
  createHash,
  makePrefixString,
  renderTemplate,
  writeFileSyncRecursive,
  isOnlyOneDefined,
  hasTemplateInstruction,
  isLocalFilePath,
}
