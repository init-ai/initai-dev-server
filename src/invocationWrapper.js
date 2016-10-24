'use strict'

let InitClient

const path = require('path')

const projectSourcePath = process.argv[2]
const messageContext = JSON.parse(process.argv[3])
const projectMainScript = require(path.resolve(projectSourcePath, 'behavior/scripts/index'))
const handleSuccess = result => {
  process.send({
    message: 'succeed',
    result,
  })
}

function handleError(error) {
  process.send({
    message: 'fail',
    code: error.code || null,
    result: JSON.stringify(error.stack),
  })
}

process.on('uncaughtException', handleError)

const mockLambdaContext = {
  succeed: handleSuccess,
  fail(result) {
    process.send({
      message: 'fail',
      result: result,
    })

    process.exit(1)
  },
}

try {
  InitClient = require(path.resolve(projectSourcePath, 'node_modules/initai-node'))
  projectMainScript.handle(InitClient.create(messageContext, mockLambdaContext))
} catch (error) {
  handleError(error)
}
