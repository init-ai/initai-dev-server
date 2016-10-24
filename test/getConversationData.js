'use strict'

const childProcess = require('child_process')
const constants = require('../src/util/constants')
const fs = require('fs')
const getConversationData = require('../src/getConversationData')
const walk = require('walk')

describe('getConversationData', () => {
  let cml
  let request
  let response
  let stream
  let walker

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

    sandbox.stub(walk, 'walk')

    walker = {
      on: sinon.stub(),
      once: sinon.stub(),
    }

    walk.walk.returns(walker)
  })

  it('sends content upon success', (done) => {
    walker.on.withArgs('file', sinon.match.func)
        .callsArgWith(1, 'language/conversations', {name: 'test.md'}, () => {})

    cml.stdout.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer(JSON.stringify({
          conversation_name: 'Test',
          messages: [{
            sender: 'user',
            parts: [{
              classifications: [{
                base_type: 'string',
                sub_type: 'hello',
                style: '',
              }],
              slots: {},
            }],
          }],
        })))

    cml.once.withArgs('exit', sinon.match.func)
        .callsArgWith(1, 0)

    walker.once.withArgs('end', sinon.match.func)
        .callsArg(1)

    getConversationData((err, data) => {
      expect(err).to.equal(null)
      expect(data).to.deep.equal({
        classifications: {
          inbound: [{
            base_type: 'string',
            sub_type: 'hello',
            style: '',
          }],
          outbound: [],
        },
        conversations: [{
          conversation_name: 'Test',
          filename: 'test.md',
          messages: [{
            sender: 'user',
            parts: [{
              classifications: [{
                base_type: 'string',
                sub_type: 'hello',
                style: '',
              }],
              slots: {},
            }],
          }],
        }],
        slots: [],
      })

      done()
    })

  })

  it('sends an error message upon file-not-found', (done) => {
    walker.on.withArgs('file', sinon.match.func)
        .callsArgWith(1, 'language/conversations', {name: 'test.md'}, () => {})

    stream.once.withArgs('error', sinon.match.func).callsArg(1)

    getConversationData((err, data) => {
      expect(data).not.to.be.defined

      expect(err).to.deep.equal({
        status: 404,
        error: constants.Errors.FILE_NOT_FOUND,
        detail: 'language/conversations/test.md',
      })
    })

    done()
  })

  it('sends an error message upon failure to parse CML', done => {
    walker.on.withArgs('file', sinon.match.func)
        .callsArgWith(1, 'language/conversations', {name: 'test.md'}, () => {})

    cml.stderr.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer('Error invoking cml.'))

    cml.once.withArgs('exit', sinon.match.func)
        .callsArgWith(1, 1)

    getConversationData((err, data) => {
      expect(data).not.to.be.defined

      expect(err).to.deep.equal({
        status: 400,
        error: constants.Errors.PARSER,
        detail: 'Error invoking cml.',
      })

      done()
    })
  })

  it('sends an error message when Parser response is invalid', done => {
    walker.on.withArgs('file', sinon.match.func)
        .callsArgWith(1, 'language/conversations', {name: 'test.md'}, () => {})

    cml.stdout.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer('Non-JSON output.'))

    cml.once.withArgs('exit', sinon.match.func)
        .callsArgWith(1, 0)

    getConversationData((err, data) => {
      expect(data).not.to.be.defined

      expect(err).to.deep.equal({
        status: 500,
        error: constants.Errors.PARSER_RESPONSE_INVALID,
        detail: 'Non-JSON output.',
      })

      done()
    })
  })

  it('sends an error message upon failure to parse JSON response', done => {
    walker.on.withArgs('file', sinon.match.func)
        .callsArgWith(1, 'language/conversations', {name: 'test.md'}, () => {})

    cml.stdout.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer('Non-JSON output.'))

    cml.once.withArgs('exit', sinon.match.func)

    walker.on.withArgs('errors', sinon.match.func)
       .callsArgWith(1, 'language/conversations', [{
         name: 'test.md',
         error: {
           code: 1,
           message: 'Error opening file.',
           path: 'language/conversations/test.md',
         },
       }])

    getConversationData((err, data) => {
      expect(data).not.to.be.defined

      expect(err).to.deep.equal({
        status: 500,
        error: constants.Errors.WALKER,
        detail: [{
          code: 1,
          message: 'Error opening file.',
          path: 'language/conversations/test.md',
        }],
      })

      done()
    })
  })
})
