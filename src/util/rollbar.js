const rollbar = require('rollbar')

const pkg = require('../../package')
const constants = require('./constants')

rollbar.init(constants.ROLLBAR_KEY, {
  codeVersion: pkg.version,
  environment: process.env.NODE_ENV || constants.Environments.PRODUCTION,
})

if (process.env.NODE_ENV !== constants.Environments.DEVELOPMENT) {
  rollbar.handleUncaughtExceptions(constants.ROLLBAR_KEY, {exitOnUncaughtException: true})
}

module.exports = rollbar
