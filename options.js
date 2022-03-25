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

//   const integrated = {
//     pattern: '-i, --integrated',
//     description: 'integrated mode',
//     default: false
//   }

//   const app = {
//     pattern: '--app <Id>',
//     description: 'app Id',
//     default: 'BBot'
//   }

//   const env = {
//     pattern: '--env <environment>',
//     description: 'environment type',
//     default: 'dev'
//   }

//   const logLevel = {
//     pattern: '--log-level <level>',
//     description: 'log level',
//     choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
//     default: 'trace'
//   }

//   const account = {
//     pattern: '-a, --account <name>',
//     description: 'account name'
//   }

//   const symbol = {
//     pattern: '-s, --symbol <name>',
//     description: 'symbol name'
//   }

//   const symbols = {
//     pattern: '-ss, --symbols <name list>',
//     description: 'symbol names as comma separated list',
//     // default: 'BNBUSDT, BTCUSDT'
//   }

module.exports = {
  read,
  scan,
  outdir,
}
