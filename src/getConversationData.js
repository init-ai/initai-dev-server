'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const walk = require('walk')

const constants = require('./util/constants')
const conversations = require('./conversations')

module.exports = done => {
  const files = []
  const walker = walk.walk(constants.PATH_PREFIX, {
    followLinks: false,
  })

  walker.on('file', (root, stat, next) => {
    const filename = path.join(root, stat.name)
    const name = constants.FILE_PATH_REGEX.exec('/' + filename)[1]
    const stream = fs.createReadStream(filename)
    const cml = childProcess.spawn(
      path.resolve(__dirname, '../', 'bin', constants.CML_BINARY)
    )
    const content = []
    const error = []

    stream.pipe(cml.stdin)

    stream.once('error', () => {
      done({
        status: 404,
        error: constants.Errors.FILE_NOT_FOUND,
        detail: filename,
      })
    })

    cml.stdout.on('data', chunk => {
      content.push(chunk)
    })

    cml.stderr.on('data', chunk => {
      error.push(chunk)
    })

    cml.once('exit', code => {
      if (code === 0) {
        try {
          const conversation = JSON.parse(Buffer.concat(content))
          conversation.filename = name
          files.push(conversation)
          next()
        } catch (e) {
          done({
            status: 500,
            error: constants.Errors.PARSER_RESPONSE_INVALID,
            detail: Buffer.concat(content).toString('utf8'),
          })
        }
      } else {
        done({
          status: 400,
          error: constants.Errors.PARSER,
          detail: Buffer.concat(error).toString('utf8'),
        })
      }
    })
  })

  walker.on('errors', (root, stats) => {
    done({
      status: 500,
      error: constants.Errors.WALKER,
      detail: stats.map(stat => {
        return stat.error
      }),
    })
  })

  walker.once('end', () => {
    done(null, {
      conversations: files,
      classifications: conversations.extractClassifications(files),
      slots: conversations.extractSlotsFrom(files),
    })
  })
}
