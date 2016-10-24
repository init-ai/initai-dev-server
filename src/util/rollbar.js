const rollbar = require('rollbar')

const constants = require('./constants')

rollbar.init(constants.ROLLBAR_KEY, {
  environment: process.env.NODE_ENV || constants.Environments.PRODUCTION,
})

if (process.env.NODE_ENV !== 'development') {
  rollbar.handleUncaughtExceptions(constants.ROLLBAR_KEY, {exitOnUncaughtException: true})
}

module.exports = rollbar
