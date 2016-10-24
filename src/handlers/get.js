'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const constants = require('../util/constants')

module.exports = (request, response) => {
  const filePath = constants.PATH_PREFIX + request.params[0]
  const stream = fs.createReadStream(filePath)
  const cml = childProcess.spawn(
    path.resolve(__dirname, '../../', 'bin', constants.CML_BINARY)
  )
  const content = []
  const error = []

  stream.pipe(cml.stdin)

  stream.once('error', () => {
    response.send(404, {
      error: constants.Errors.FILE_NOT_FOUND,
      detail: filePath,
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
        response.send(200, JSON.parse(Buffer.concat(content).toString('utf8')))
      } catch (e) {
        response.send(500, {
          error: constants.Errors.PARSER_RESPONSE_INVALID,
          detail: Buffer.concat(content).toString('utf8'),
        })
      }
    } else {
      response.send(400, {
        error: constants.Errors.PARSER,
        detail: Buffer.concat(error).toString('utf8'),
      })
    }
  })
}
