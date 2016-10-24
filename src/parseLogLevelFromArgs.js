'use strict'

const logLevels = ['debug', 'warn', 'log']
const defaultLogLevel = 'log'

module.exports = function parseLogLevelFromArgs(args) {
  let logLevel = defaultLogLevel
  let filteredArgs = [].concat(args).reduce((args, arg) => {
    if (/--log-level=/.test(arg)) {
      logLevel = arg.split('=')[1]

      return args
    } else {
      return args.concat(arg)
    }
  }, [])

  if (logLevel !== defaultLogLevel && logLevels.indexOf(logLevel) === -1) {
    throw new Error('A valid Log Level must be provided')
  }

  return {
    filteredArgs,
    logLevel,
  }
}
