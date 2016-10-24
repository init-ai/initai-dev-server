'use strict'

const childProcess = require('child_process')
const constants = require('../../src/util/constants')
const fs = require('fs')
const get = require('../../src/handlers/get')

describe('get', () => {
  let cml
  let request
  let response
  let stream

  beforeEach(() => {
    sandbox.stub(childProcess, 'spawn')

    cml = {
      once: sinon.stub(),
      stderr: {
        on: sinon.stub(),
      },
      stdout: {
        on: sinon.stub(),
      },
    }

    childProcess.spawn.returns(cml)

    sandbox.stub(fs, 'createReadStream')

    stream = {
      once: sinon.stub(),
      pipe: sinon.stub(),
    }

    fs.createReadStream.returns(stream)

    request = {
      params: ['test.md'],
      pipe() {},
    }

    response = {
      pipe: sinon.stub(),
      send: sinon.spy(),
    }
  })

  it('sends content upon success', () => {
    cml.stdout.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer('{"conversation_name":"","messages":[]}'))

    cml.once.withArgs('exit', sinon.match.func)
        .callsArgWith(1, 0)

    get(request, response, null, {childProcess, fs})

    expect(response.send).to.have.been.calledWith(200, {
      conversation_name: '',
      messages: [],
    })
  })

  it('sends an error message upon file-not-found', () => {
    stream.once.withArgs('error', sinon.match.func).callsArg(1)

    get(request, response, null, {childProcess, fs})

    expect(response.send).to.have.been.calledWith(404, {
      error: constants.Errors.FILE_NOT_FOUND,
      detail: 'language/conversations/test.md',
    })
  })

  it('sends an error message upon failure to parse CML', () => {
    cml.stderr.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer('Error invoking cml.'))

    cml.once.withArgs('exit', sinon.match.func)
        .callsArgWith(1, 1)

    get(request, response, null, {childProcess, fs})

    expect(response.send).to.have.been.calledWith(400, {
      error: constants.Errors.PARSER,
      detail: 'Error invoking cml.',
    })
  })

  it('sends an error message upon failure to parse JSON response', () => {
    cml.stdout.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer('Non-JSON output.'))

    cml.once.withArgs('exit', sinon.match.func)
        .callsArgWith(1, 0)

    get(request, response, null, {childProcess, fs})

    expect(response.send).to.have.been.calledWith(500, {
      error: constants.Errors.PARSER_RESPONSE_INVALID,
      detail: 'Non-JSON output.',
    })
  })
})
