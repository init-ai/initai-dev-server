'use strict'

const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const Pusher = require('pusher-js/node')

const LocalExecutionTester = require('../src/LocalExecutionTester')
const logger = require('../src/util/logger')

describe('LocalExecutionTester', () => {
  beforeEach(() => {
    sandbox.stub(logger, 'log')
    sandbox.stub(logger, 'logError')
    sandbox.stub(logger, 'logSuccess')
    sandbox.stub(LocalExecutionTester.prototype, 'configurePusher')
    sandbox.stub(LocalExecutionTester.prototype, 'configureAPIForTesting')
  })

  describe('create', () => {
    it('exports a factory method', () => {
      expect(typeof LocalExecutionTester.create).to.equal('function')
    })
  })

  describe('constructor', () => {
    let fakeConfig

    beforeEach(() => {
      fakeConfig = {
        appId: 'fakeAppId',
        testAppUser: {id: 'fakeAppUserId'},
        environment: 'production',
        jwtToken: 'fakeJWTToken',
        projectSourcePath: 'fakeProjectSourcePath',
      }
    })

    it('assigns properties', () => {
      const tester = new LocalExecutionTester(fakeConfig)

      expect(tester.appId).to.equal(fakeConfig.appId)
      expect(tester.appUserId).to.equal(fakeConfig.testAppUser.id)
      expect(tester.apiBaseUrl).to.equal('https://api.init.ai/api/v1')
      expect(tester.jwtToken).to.equal(fakeConfig.jwtToken)
      expect(tester.projectSourcePath).to.equal(fakeConfig.projectSourcePath)
      expect(tester.channel).to.equal(null)
      expect(tester.channelNonce).to.equal(null)
      expect(tester.environment).to.equal(fakeConfig.environment)
    })

    it('assigns fallback values', () => {
      let config = fakeConfig

      delete config.environment
      delete config.projectSourcePath

      sandbox.stub(path, 'resolve').returns('foo')

      const tester = new LocalExecutionTester(config)

      expect(tester.environment).to.equal('test')
      expect(tester.apiBaseUrl).to.equal(undefined) // There is no test mapping

      expect(tester.projectSourcePath).to.equal('foo')
    })

    it('assigns bound function handlers', () => {
      const tester = new LocalExecutionTester(fakeConfig)

      expect(typeof tester.logicInvocationEventHandler).to.equal('function')
    })

    it('initializes instance methods', () => {
      const tester = new LocalExecutionTester(fakeConfig)

      expect(tester.configurePusher).to.have.been.called
      expect(tester.configureAPIForTesting).to.have.been.called
    })
  })

  describe('connectToPusher', () => {
    const fakeDestinationChannel = 'presence-ad98bb9b-19f6-434d-7a4f-403cb2adfa35-480162d4-266e-4035-69b6-93dcc1d984c2-uozaraexmhp3ul123l9ha3ycbm1v08uc'

    it('sets instance properties from destinationChannel', () => {
      const fakeChannel = {bind: sandbox.spy()}
      const fakeContext = {
        appUserId: 'fakeAppUserId',
        pusher: {
          subscribe: sandbox.stub().returns(fakeChannel),
          unsubscribe: sandbox.spy(),
        }
      }

      LocalExecutionTester.prototype.connectToPusher.call(fakeContext, fakeDestinationChannel)

      expect(fakeContext.appUserId).to.equal('fakeAppUserId')
      expect(fakeContext.channelNonce).to.equal('uozaraexmhp3ul123l9ha3ycbm1v08uc')
      expect(fakeContext.channel).to.equal(fakeChannel)
    })

    it('sets appUserId if not present', () => {
      const fakeChannel = {bind: sandbox.spy()}
      const fakeContext = {
        pusher: {
          subscribe: sandbox.stub().returns(fakeChannel),
          unsubscribe: sandbox.spy(),
        }
      }

      LocalExecutionTester.prototype.connectToPusher.call(fakeContext, fakeDestinationChannel)

      expect(fakeContext.appUserId).to.equal('480162d4-266e-4035-69b6-93dcc1d984c2')
    })

    it('binds to a logic.invocation event', () => {
      const fakeChannel = {bind: sandbox.spy()}
      const fakeHandler = function () {}
      const fakeContext = {
        logicInvocationEventHandler: fakeHandler,
        pusher: {
          subscribe: sandbox.stub().returns(fakeChannel),
          unsubscribe: sandbox.spy(),
        }
      }

      LocalExecutionTester.prototype.connectToPusher.call(fakeContext, fakeDestinationChannel)

      expect(fakeChannel.bind).to.have.been.calledWith('logic:invocation', fakeHandler)
    })

    it('unsubscribes from channel if previously subscribed', () => {
      const fakeChannel = {bind: sandbox.spy()}
      const fakeContext = {
        channel: {name: 'foo'},
        pusher: {
          subscribe: sandbox.stub().returns(fakeChannel),
          unsubscribe: sandbox.spy(),
        }
      }

      LocalExecutionTester.prototype.connectToPusher.call(fakeContext, fakeDestinationChannel)

      expect(fakeContext.pusher.unsubscribe).to.have.been.calledWith('foo')
    })
  })

  describe('handleLogicInvocationEvent', () => {
    it('requests event payload from API', () => {
      const requestSpy = sandbox.spy()
      const fakePayload = {foo: 'bar'}
      const fakeContext = {
        requestEventPayloadFromAPI: requestSpy
      }

      LocalExecutionTester.prototype.handleLogicInvocationEvent.call(fakeContext, fakePayload)

      expect(requestSpy).to.have.been.calledWith(sinon.match.string, fakePayload)
    })

    it('logs and throws returned error', () => {
      const fakeError = {foo: 'bar'}
      const requestSpy = sandbox.spy((_, payload, cb) => {
        cb(fakeError)
      })
      const fakeContext = {
        requestEventPayloadFromAPI: requestSpy,
      }

      function run() {
        LocalExecutionTester.prototype.handleLogicInvocationEvent.call(fakeContext, {})
      }

      expect(run).to.throw(fakeError)
      expect(logger.logError).to.have.been.calledWith(fakeError)
    })

    it('logs error message for 404', () => {
      const fakeResponse = {statusCode: 404}
      const fakeBody = {foo: 'bar'}
      const requestSpy = sandbox.spy((_, payload, cb) => {
        cb(null, fakeResponse, fakeBody)
      })
      const fakeContext = {
        apiBaseUrl: 'fakeApiBaseUrl',
        requestEventPayloadFromAPI: requestSpy,
      }

      LocalExecutionTester.prototype.handleLogicInvocationEvent.call(fakeContext, {invocation_id: 'foo'})

      expect(logger.logError).to.have.been.calledWith('Failed to fetch fakeApiBaseUrl/remote/logic/invocations/foo/payload. Proper authorization is required.')
    })

    it('logs error for non-200 response', () => {
      const fakeResponse = {statusCode: 500}
      const fakeBody = {foo: 'bar'}
      const requestSpy = sandbox.spy((_, payload, cb) => {
        cb(null, fakeResponse, fakeBody)
      })
      const fakeContext = {
        apiBaseUrl: 'fakeApiBaseUrl',
        requestEventPayloadFromAPI: requestSpy,
      }

      LocalExecutionTester.prototype.handleLogicInvocationEvent.call(fakeContext, {invocation_id: 'foo'})

      expect(logger.logError).to.have.been.calledWith(fakeBody)
    })

    it('processes invocation', () => {
      const fakeResponse = {statusCode: 200}
      const fakePayloadJSON = {foo: 'bar'}
      const fakeBody = JSON.stringify({
        body: {payload: fakePayloadJSON}
      })
      const processInvocationSpy = sandbox.spy()
      const requestSpy = sandbox.spy((_, payload, cb) => {
        cb(null, fakeResponse, fakeBody)
      })
      const fakePayload = {invocation_id: '123'}
      const fakeContext = {
        apiBaseUrl: 'fakeApiBaseUrl',
        requestEventPayloadFromAPI: requestSpy,
        processInvocation: processInvocationSpy,
      }

      LocalExecutionTester.prototype.handleLogicInvocationEvent.call(fakeContext, fakePayload)

      expect(processInvocationSpy).to.have.been.calledWith(fakePayloadJSON, sinon.match.func)
    })

    it('triggers an event on the channel when successful', () => {
      const fakeResponse = {statusCode: 200}
      const fakePayloadJSON = {
        payload: {
          execution_data: {execution_id: '1'},
          current_application: {id: 'cid'},
          current_conversation: {__private_temp_user_id: 'ptui'},
        }
      }
      const fakeBody = JSON.stringify({
        body: {payload: fakePayloadJSON}
      })
      const requestSpy = sandbox.spy((_, payload, cb) => {
        cb(null, fakeResponse, fakeBody)
      })
      const fakeResult = {foo: 'bar'}
      const processInvocationSpy = sandbox.spy((event, cb) => {
        cb(fakeResult)
      })
      const triggerSpy = sandbox.stub().returns(true)
      const fakeContext = {
        apiBaseUrl: 'fakeApiBaseUrl',
        requestEventPayloadFromAPI: requestSpy,
        processInvocation: processInvocationSpy,
        channel: {
          trigger: triggerSpy,
        },
        processInvocation(data, cb) {
          cb(fakeResult)
        },
      }

      LocalExecutionTester.prototype.handleLogicInvocationEvent.call(fakeContext, {})

      expect(triggerSpy).to.have.been.calledWith('client-logic:result', {
        invocation: {
          invocation_id: '1',
          app_id: 'cid',
          app_user_id: 'ptui',
        },
        result: fakeResult,
      })
    })

    it('logs an error when event cannot be sent', () => {
      const fakeResponse = {statusCode: 200}
      const fakePayloadJSON = {
        payload: {
          execution_data: {execution_id: '1'},
          current_application: {id: 'cid'},
          current_conversation: {__private_temp_user_id: 'ptui'},
        }
      }
      const fakeBody = JSON.stringify({
        body: {payload: fakePayloadJSON}
      })
      const requestSpy = sandbox.spy((_, payload, cb) => {
        cb(null, fakeResponse, fakeBody)
      })
      const fakeResult = {foo: 'bar'}
      const processInvocationSpy = sandbox.spy((event, cb) => {
        cb(fakeResult)
      })
      const triggerSpy = sandbox.stub().returns(false)
      const fakeContext = {
        apiBaseUrl: 'fakeApiBaseUrl',
        requestEventPayloadFromAPI: requestSpy,
        processInvocation: processInvocationSpy,
        channel: {
          trigger: triggerSpy,
        },
        processInvocation(data, cb) {
          cb(fakeResult)
        },
      }

      LocalExecutionTester.prototype.handleLogicInvocationEvent.call(fakeContext, {})

      expect(logger.logError).to.have.been.calledWith(
        'Failed to send event over channel',
        {
          event: 'client-logic:result',
          payload: {
            invocation: {
              invocation_id: '1',
              app_id: 'cid',
              app_user_id: 'ptui',
            },
            result: fakeResult,
          },
        }
      )
    })
  })

  describe('processInvocation', () => {
    beforeEach(() => {
      sandbox.stub(logger, 'logClean')
      sandbox.stub(childProcess, 'fork').returns({
        kill() {},
        on() {},
      })
      sandbox.stub(path, 'resolve').returns('fake/path')
      sandbox.stub(logger, 'logWarning')
    })

    it('forks a child process', () => {
      const fakeContext = {
        projectSourcePath: 'foo',
      }
      const fakePayload = {foo: 'bar'}
      const fakeCallback = sandbox.spy()

      LocalExecutionTester.prototype.processInvocation.call(fakeContext, fakePayload)

      expect(childProcess.fork).to.have.been.calledWith(
        'fake/path',
        [
          'foo',
          JSON.stringify(fakePayload),
        ]
      )
    })

    it('kills child process if timeout expires', (done) => {
      childProcess.fork.restore()

      const killSpy = sandbox.spy()

      sandbox.stub(childProcess, 'fork').returns({
        kill: killSpy,
        on() {}
      })

      const fakeContext = {
        projectSourcePath: 'foo',
      }
      const fakePayload = {foo: 'bar'}
      const fakeCallback = sandbox.spy()


      LocalExecutionTester.prototype.processInvocation.call(fakeContext, fakePayload)

      setTimeout(() => {
        expect(killSpy).to.have.been.called
        done()
      }, 700)
    })

    it('invokes callback with result', () => {
      childProcess.fork.restore()

      const fakeBus = {
        events: {},
        emit(event, data) {
          fakeBus.events[event](data)
        },
        on(event, fn) {
          fakeBus.events[event] = fn
        }
      }

      sandbox.stub(childProcess, 'fork').returns(Object.assign({}, fakeBus, {
        kill() {},
      }))

      const fakeContext = {
        projectSourcePath: 'foo',
      }
      const fakePayload = {foo: 'bar'}
      const fakeCallback = sandbox.spy()
      const fakeSuccessPayload = {
        payload: {
          conversation_state: {foo: 'bar'},
          messages: ['a', 'b'],
        }
      }

      LocalExecutionTester.prototype.processInvocation.call(fakeContext, fakePayload, fakeCallback)

      fakeBus.emit('message', {message: 'succeed', result: fakeSuccessPayload})

      expect(fakeCallback).to.have.been.calledWith(fakeSuccessPayload)
    })

    it('logs a logic error', () => {
      childProcess.fork.restore()

      const fakeBus = {
        events: {},
        emit(event, data) {
          fakeBus.events[event](data)
        },
        on(event, fn) {
          fakeBus.events[event] = fn
        }
      }

      sandbox.stub(childProcess, 'fork').returns(Object.assign({}, fakeBus, {
        kill() {},
      }))

      const fakeContext = {
        projectSourcePath: 'foo',
      }
      const fakePayload = {foo: 'bar'}
      const fakeCallback = sandbox.spy()

      LocalExecutionTester.prototype.processInvocation.call(fakeContext, fakePayload, fakeCallback)

      fakeBus.emit('message', {message: 'fail', result: JSON.stringify({foo: 'bar'})})

      expect(logger.logClean).to.have.been.calledWith('\n')
      expect(logger.logClean).to.have.been.calledWith({foo: 'bar'})
    })
  })

  describe('destroy', () => {
    it('disconnects and nullifies pusher instance', () => {
      const disconnectSpy = sandbox.spy()
      const fakeContext = {
        pusher: {
          disconnect: disconnectSpy,
        },
      }

      LocalExecutionTester.prototype.destroy.call(fakeContext)

      expect(disconnectSpy).to.have.been.called
      expect(fakeContext.pusher).to.equal(null)
    })
  })
})
