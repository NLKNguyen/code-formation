function read(opts) {
  const { program, Option } = require("commander")

  for (let opt of opts) {
    let option = new Option(opt.pattern, opt.description)

    if (opt.choices) {
      option.choices(opt.choices)
    }
    if (opt.default !== undefined) {
      option.default(opt.default)
    }

    program.addOption(option)
  }

  program.allowUnknownOption()

  program.parse(process.argv)

  const options = program.opts()
  return options
}

const outdir = {
  pattern: "-o, --outdir <directory>",
  description: "output directory",
}

const scan = {
  pattern: "-s, --scan <file patterns>",
  description: "glob file patterns to be scanned, separated by semi-colon ;",
}

module.exports = {
  read,
  scan,
  outdir,
}
