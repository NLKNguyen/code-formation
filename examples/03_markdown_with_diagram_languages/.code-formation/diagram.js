/* 
For code-formation template engine.

This file will be scanned by code-formation tool to register this Node.js module
as "diagram" snippet which can then be called in the render instructions.

The purpose of this module is to send diagram source code to Kroki.io, a free
diagram renderer service, to generate image file, and it also caches the diagram
source code next to the image file in order to use for change detection purpose.

Some general information for Node.js module for code-formation:

+ "require" function is available to reference local or standard Node packages.
+ "requireg" function is available to reference global Node package.

+ "_"  object is available for Lodash utilities
+ "_logger" object is available for Winston logging (.info, .verbose, etc.)
+ "_common" object is available for commonly used utilities

+ "process" object is available for Node.js process in a sandbox that runs this.
*/

// $<:diagram (LANGUAGE "nodejs") (type "") (output "")
const path = require("path")
const fs = require("fs") // file IO
const fetch = _common.modules.fetch // HTTP client

const chalk = _common.modules.chalk // Colorful console log

const DIAGRAM_SERVER = process.env.KROKI_SERVER || "https://kroki.io"

module.exports = async (context) => {
  const tag = `${chalk.blue("[diagram]:")}` // log prefix for easy tracing
  let diagram_source = context.INPUT
  let summary = ""
  context.src = context.src || "raw"
  switch (context.src) {      
    case "raw": {
      diagram_source = context.INPUT
      break
    }    
    case "markdown-code-block": {
      const marked = _common.modules.marked // Markdown parser
      const cheerio = _common.modules.cheerio // jQuery for Node
      const html = marked.parse(context.INPUT) // parse Markdown content of the input to HTML
      const $ = cheerio.load(html) // for HTML element lookup in jQuery style

      summary = $("summary").html() // assuming there is a common <summary> tag in <details> tag
      diagram_source = $("code").text() // extract the Markdown code block which is converted to <code> HTML tag
      break
    }
    default:
      throw new Error(`${tag} unknown src value '${context.src}'`)
  }

  const diagram_type = context.type

  const dotPos = context.out.lastIndexOf(".")
  const outputPrefix = context.out.slice(0, dotPos)
  const outputFormats = context.out.slice(dotPos + 1).split(",")

  const renderParams = {}

  const sourceFile = `${outputPrefix}.txt`

  if (
    fs.existsSync(sourceFile) &&
    fs.readFileSync(sourceFile, "utf8") === diagram_source
  ) {
    _logger.info(
      `${tag} ${chalk.gray(
        `skip identical diagram source as cached in ${sourceFile}"`
      )}`
    )
  } else {
    for (let output_format of outputFormats) {
      const outputFile = `${outputPrefix}.${output_format}`
      const queryParams = new _common.modules.URLSearchParams(renderParams)

      _logger.info(
        `${tag} ${chalk.gray(
          `call ${DIAGRAM_SERVER}`
        )}`
      )
      const response = await fetch(`${DIAGRAM_SERVER}`,  // ?${queryParams}
      {
        method: "post",
        body: JSON.stringify({
          diagram_source,
          diagram_type,
          output_format,
        }),
        headers: { "Content-Type": "application/json" },
      })

      if (response.status === 200) {
        switch (output_format) {
          case "svg": // save as plain text
            const svg = await response.text()
            _logger.info(`${tag} ${chalk.gray(`save svg to "${outputFile}"`)}`)
            fs.writeFileSync(outputFile, svg, "utf8")
            break

          default: // save as binary
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            _logger.info(
              `${tag} ${chalk.gray(`save ${output_format} to "${outputFile}"`)}`
            )
            fs.createWriteStream(outputFile).write(buffer)
        }
      } else {
        const message = await response.text()
        throw new Error(`${tag} Diagram Render ${message}`)
      }
    }

    _logger.info(
      `${tag} ${chalk.gray(`cache diagram source to "${sourceFile}"`)}`
    )
    fs.writeFileSync(sourceFile, diagram_source, "utf8")
  }

  if (context.sub) {
    return context.sub
  } else {
    return `▶ ${summary}`
  }
}
