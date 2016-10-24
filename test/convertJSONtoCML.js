'use strict'

const childProcess = require('child_process')
const stream = require('stream')
const constants = require('../src/util/constants')
const convertJSONtoCML = require('../src/convertJSONtoCML')

describe('convertJSONtoCML', () => {
  let cml
  let fakePayload

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

    fakePayload = {
      messages: [
        {
          parts: [
            {content: 'fpp'},
            {content: 'bar'},
          ],
        },
      ],
    }

    stream.Readable = function () {
      return {
        push() {},
        pipe() {},
      }
    }
  })

  it('sends content upon success', done => {
    cml.stdout.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer('Hello world.\n* hello\n'))

    cml.once.withArgs('exit', sinon.match.func)
        .callsArgWith(1, 0)

    convertJSONtoCML(fakePayload, (err, data) => {
      expect(err).not.to.be.defined

      expect(data).to.deep.equal({
        content: 'Hello world.\n* hello\n',
      })

      done()
    })
  })

  it('sends an error message upon failure', done => {
    cml.stderr.on.withArgs('data', sinon.match.func)
        .callsArgWith(1, new Buffer('Error invoking cml.'))

    cml.once.withArgs('exit', sinon.match.func)
        .callsArgWith(1, 1)

    convertJSONtoCML(fakePayload, (err, data) => {
      expect(data).not.to.be.defined

      expect(err).to.deep.equal({
        detail: 'Error invoking cml.',
        error: constants.Errors.GENERATOR,
        status: 400,
      })

      done()
    })
  })
})
