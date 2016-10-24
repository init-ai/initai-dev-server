'use strict'

const natural = require('natural')
const chalk = require('chalk')

const logger = require('./util/logger')

const spellcheckCorpus = ['watch']
const programSpellcheck = new natural.Spellcheck(spellcheckCorpus)

module.exports = function handleInvalidArguments(args) {
  const programName = args[0] || ''
  const suggestions = programSpellcheck.getCorrections(programName)

  let reply = '"' + args[0] + '" is not a valid command'

  if (suggestions.length) {
    reply = chalk.gray('Unknown command. Did you mean:\n')

    suggestions.forEach(suggestion => {
      reply += '\n$ iai ' + suggestion
    })
  }

  return reply + logger.getCommonAppendix()
}
