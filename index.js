#!/usr/bin/env node

'use strict'

const chalk = require('chalk')
const Server = require('./src/Server')
const logger = require('./src/util/logger')
const nodeVersion = process.versions.node

if (nodeVersion !== '4.3.2') {
  logger.logClean('\n')
  logger.logClean(chalk.yellow('-----------------------------------------------------------'))
  logger.logClean(chalk.yellow.bold('WARNING!'), 'You are not using Node.js version', chalk.blue.bold('4.3.2'))
  logger.logClean(chalk.gray('\nCurrent detected version:'), chalk.yellow.bold(`${nodeVersion}`))
  logger.logClean('\n')
  logger.logClean('See docs:', chalk.blue.underline('http://docs.init.ai/reference/dev-server.html'))
  logger.logClean(chalk.yellow('-----------------------------------------------------------'))
  logger.logClean('\n')
}

module.exports = new Server()
