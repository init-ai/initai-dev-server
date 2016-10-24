'use strict'

const fs = require('fs')
const SocketApp = require('../src/SocketApp')
const LocalExecutionTester = require('../src/LocalExecutionTester')
const logger = require('../src/util/logger')

describe('SocketApp', () => {
  let fakeSocket

  beforeEach(() => {
    sandbox.stub(logger, 'log')

    fakeSocket = {
      on: sandbox.stub(),
      emit: sandbox.stub(),
    }
  })

  describe('constructor', () => {
    beforeEach(() => {
      sandbox.stub(SocketApp.prototype, 'attachEvents')
      sandbox.stub(SocketApp.prototype, 'watchForChanges')
    })

    it('sets instance properties', () => {
      const socketApp = new SocketApp({socket: fakeSocket})

      expect(socketApp.socket).to.deep.equal(fakeSocket)
      expect(socketApp.tester).to.equal(null)
    })

    it('calls attachEvents', () => {
      const socketApp = new SocketApp({socket: fakeSocket})

      expect(socketApp.attachEvents).to.have.been.called
    })
  })

  describe('attachEvents', () => {
    it('binds handlers', () => {
      SocketApp.prototype.attachEvents.call({
        handleRequestCLIState: sandbox.spy(),
        socket: fakeSocket,
        startLocalTester: sandbox.spy(),
        stopLocalTester: sandbox.spy(),
        toggleLocalLocalExecutionTester: sandbox.spy(),
        watchForChanges: sandbox.stub(),
      })

      expect(fakeSocket.on.args).to.have.length(6)
      expect(fakeSocket.on.args[0][0]).to.equal('REQUEST_CLI_STATE')
      expect(fakeSocket.on.args[1][0]).to.equal('REQUEST_CONVERSATION_DATA')
      expect(fakeSocket.on.args[2][0]).to.equal('CONVERT_JSON_TO_CML')
      expect(fakeSocket.on.args[3][0]).to.equal('REQUEST_LOCAL_TESTER_START')
      expect(fakeSocket.on.args[4][0]).to.equal('REQUEST_LOCAL_TESTER_STOP')
      expect(fakeSocket.on.args[5][0]).to.equal('disconnect')
    })
  })

  describe('watchForChanges', () => {
    let fakeWatcher

    beforeEach(() => {
      fakeWatcher = {
        events: {},
        on(evt, fn) {
          if (fakeWatcher.events.hasOwnProperty(evt)) {
            fakeWatcher.events[evt].push(fn)
          } else {
            fakeWatcher.events[evt] = [fn]
          }
        },
        emit(evt) {
          fakeWatcher.events[evt].forEach(fn => {
            fn()
          })
        }
      }

      sandbox.stub(fs, 'watch').returns(fakeWatcher)
    })

    it('emits a FILE_CHANGED event', () => {
      SocketApp.prototype.watchForChanges.call({socket: fakeSocket})

      fakeWatcher.emit('change')

      expect(fakeSocket.emit).to.have.been.calledWith('FILE_CHANGED')
    })
  })

  describe('handleRequestCLIState', () => {
    it('invokes callback with current state', () => {
      const replySpy = sandbox.spy()
      const fakeContext = {state: {foo: 'bar'}}

      SocketApp.prototype.handleRequestCLIState.call(fakeContext, replySpy)

      expect(replySpy).to.have.been.calledWith({foo: 'bar'})
    })
  })

  describe('startLocalTester', () => {
    it('stops previously running Tester instance', () => {
      const stopLocalTesterSpy = sandbox.spy()
      const fakeContext = {
        stopLocalTester: stopLocalTesterSpy,
        socket: {
          emit: sandbox.stub()
        }
      }

      SocketApp.prototype.startLocalTester.call(fakeContext)

      expect(stopLocalTesterSpy).to.have.been.called
    })

    it('emits an event to fetch testing credentials', () => {
      const emitSpy = sandbox.spy()
      const fakeContext = {
        stopLocalTester: sandbox.stub(),
        socket: {
          emit: emitSpy
        },
        tester: null
      }

      SocketApp.prototype.startLocalTester.call(fakeContext)

      expect(emitSpy).to.have.been.calledWith('REQUEST_LOCAL_TESTING_CREDENTIALS', sinon.match.func)
    })

    it('validates payload before instantiating a new LocalExecutionTester', () => {
      const fakePayload = {foo: 'bar'}
      const fakeContext = {
        stopLocalTester: sandbox.stub(),
        socket: {
          emit(event, cb) {cb(fakePayload)}
        }
      }

      sandbox.stub(SocketApp, 'LocalExecutionTesterPayloadIsValid').returns(false)

      SocketApp.prototype.startLocalTester.call(fakeContext)

      expect(SocketApp.LocalExecutionTesterPayloadIsValid).to.have.been.calledWith(fakePayload)
    })

    it('instantiates a new LocalExecutionTester', () => {
      const fakePayload = {
        appId: 'fakeAppId',
        testAppUser: 'fakeTestAppUser',
        environment: 'fakeEnv',
        jwtToken: 'fakeJWTToken',
      }
      const fakeContext = {
        stopLocalTester: sandbox.stub(),
        state: {},
        socket: {
          emit: sandbox.spy((event, cb) => {
            if (event === 'REQUEST_LOCAL_TESTING_CREDENTIALS') {
              cb(fakePayload)
            }
          })
        }
      }

      sandbox.stub(SocketApp, 'LocalExecutionTesterPayloadIsValid').returns(true)
      sandbox.stub(LocalExecutionTester, 'create')

      SocketApp.prototype.startLocalTester.call(fakeContext)

      expect(LocalExecutionTester.create).to.have.been.calledWith(fakePayload)
      expect(fakeContext.state).to.deep.equal({localTesterIsRunning: true})
      expect(fakeContext.socket.emit).to.have.been.calledWith('LOCAL_TESTER_STARTED')
    })
  })

  describe('stopLocalTester', () => {
    it('destroys current LocalExecutionTester instance', () => {
      const destroySpy = sandbox.spy()
      const emitSpy = sandbox.spy()
      const fakeContext = {
        state: {localTesterIsRunning: true},
        tester: {
          destroy: destroySpy
        },
        socket: {emit: emitSpy}
      }

      SocketApp.prototype.stopLocalTester.call(fakeContext)

      expect(destroySpy).to.have.been.called
      expect(fakeContext.tester).to.equal(null)
      expect(fakeContext.state).to.deep.equal({localTesterIsRunning: false})
      expect(emitSpy).to.have.been.calledWith('LOCAL_TESTER_STOPPED')
    })
  })

  describe('statics', () => {
    describe('LocalExecutionTesterPayloadIsValid', () => {
      beforeEach(() => {
        sandbox.stub(logger, 'logError')
      })

      it('returns true if all values are found', () => {
        const fakePayload = {
          appId: 'fakeAppId',
          testAppUser: 'fakeTestAppUser',
          environment: 'testing',
          jwtToken: 'fakeJWTToken',
          remoteToken: 'fakeRemoteToken',
        }
        const result = SocketApp.LocalExecutionTesterPayloadIsValid(fakePayload)

        expect(result).to.equal(true)
      })

      it('logs an error if a missing value is found', () => {
        const fakePayload = {
          appId: 'fakeAppId',
          environment: null,
          jwtToken: 'fakeJWTToken',
          remoteToken: 'fakeRemoteToken',
          testAppUser: 'fakeTestAppUser',
        }
        const result = SocketApp.LocalExecutionTesterPayloadIsValid(fakePayload)

        expect(result).to.equal(false)
        expect(logger.logError).to.have.been.calledWith(
          'One or more of the following key(s) is missing: environment'
        )
      })

      it('logs an error if multiple missing values are found', () => {
        const fakePayload = {
          appId: 'fakeAppId',
          environment: null,
          jwtToken: 'fakeJWTToken',
        }
        const result = SocketApp.LocalExecutionTesterPayloadIsValid(fakePayload)

        expect(result).to.equal(false)
        expect(logger.logError).to.have.been.calledWith(
          'One or more of the following key(s) is missing: testAppUser, environment, remoteToken'
        )
      })
    })
  })
})
