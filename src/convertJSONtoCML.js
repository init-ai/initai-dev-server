'use strict'

const childProcess = require('child_process')
const path = require('path')
const stream = require('stream')

const constants = require('./util/constants')

module.exports = (payload, done) => {
  const cmlBinary = path.resolve(__dirname, '../', 'bin', constants.CML_BINARY)
  const cml = childProcess.spawn(cmlBinary, ['--json-to-cml'])
  const content = []
  const error = []
  const readStream = new stream.Readable()

  readStream.push(JSON.stringify(payload))
  readStream.push(null)
  readStream.pipe(cml.stdin)

  cml.stdout.on('data', chunk => {
    content.push(chunk)
  })

  cml.stderr.on('data', chunk => {
    error.push(chunk)
  })

  cml.once('exit', code => {
    if (code === 0) {
      done(null, {
        content: Buffer.concat(content).toString('utf8'),
      })
    } else {
      done({
        status: 400,
        error: constants.Errors.GENERATOR,
        detail: Buffer.concat(error).toString('utf8'),
      })
    }
  })
}
