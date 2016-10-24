'use strict'

const fs = require('fs')
const isFunction = require('lodash.isfunction')

const LocalExecutionTester = require('./LocalExecutionTester')
const constants = require('./util/constants')
const convertJSONtoCML = require('./convertJSONtoCML')
const getConversationData = require('./getConversationData')
const logger = require('./util/logger')

const SocketEvents = constants.SocketEvents

class SocketApp {
  constructor(options) {
    logger.log('Socket connection established')

    this.socket = options.socket
    this.tester = null
    this.state = {localTesterIsRunning: false}
    this.attachEvents()
    this.watchForChanges()
  }

  attachEvents() {
    this.socket.on(SocketEvents.REQUEST_CLI_STATE, this.handleRequestCLIState.bind(this))
    this.socket.on(SocketEvents.REQUEST_CONVERSATION_DATA, this.handleRequestConversationData)
    this.socket.on(SocketEvents.CONVERT_JSON_TO_CML, this.handleConvertJSONToCML)
    this.socket.on(SocketEvents.REQUEST_LOCAL_TESTER_START, this.startLocalTester.bind(this))
    this.socket.on(SocketEvents.REQUEST_LOCAL_TESTER_STOP, this.stopLocalTester.bind(this))
    this.socket.on(SocketEvents.DISCONNECT, this.handleDisconnect)
  }

  handleDisconnect() {
    logger.log('Socket disconnected')
  }

  // TODO: Write tests
  handleRequestCLIState(reply) {
    reply(this.state)
  }

  handleRequestConversationData(reply) {
    if (!isFunction(reply)) {
      reply = () => {}
    }

    getConversationData(reply)
  }

  handleConvertJSONToCML(data, reply) {
    if (!isFunction(reply)) {
      reply = () => {}
    }

    convertJSONtoCML(data, reply)
  }

  watchForChanges() {
    try {
      const watcher = fs.watch(constants.PATH_PREFIX, {
        persistent: false,
        recursive: true,
      })

      watcher.on('change', () => {
        this.socket.emit(SocketEvents.FILE_CHANGED)
      })

      // TODO Handle error
      // watcher.on('error', () => {})
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.logWarning('It appears you may not be in an Init.ai project repository. Make sure to run the CLI from the appropriate directory.')
      } else {
        logger.logError(error)
      }
    }
  }

  startLocalTester() {
    this.stopLocalTester()

    logger.log('Requesting local testing credentials')

    this.socket.emit(SocketEvents.REQUEST_LOCAL_TESTING_CREDENTIALS, (payload) => {
      logger.log('Received local testing credentials. Enabling local tester')

      if (SocketApp.LocalExecutionTesterPayloadIsValid(payload)) {
        this.tester = LocalExecutionTester.create(payload)
        this.state.localTesterIsRunning = true

        this.socket.emit(SocketEvents.LOCAL_TESTER_STARTED)
      }
    })
  }

  stopLocalTester() {
    if (this.state.localTesterIsRunning) {
      logger.log('Stopping local tester')
      this.tester.destroy()
      this.tester = null
      this.state.localTesterIsRunning = false
      this.socket.emit(SocketEvents.LOCAL_TESTER_STOPPED)
      logger.log('Local tester stopped')
    }
  }
}

SocketApp.LocalExecutionTesterPayloadIsValid = (payload) => {
  let isValid = true
  const requiredKeys = [
    'appId',
    'testAppUser',
    'environment',
    'jwtToken', // User token
    'remoteToken', // Remote token
  ]

  const missingKeys = requiredKeys.reduce((missingKeys, key) => {
    if (!payload[key]) {
      missingKeys.push(key)
    }

    return missingKeys
  }, []).join(', ')

  if (missingKeys.length) {
    isValid = false
    logger.logError(`One or more of the following key(s) is missing: ${missingKeys}`)
  }

  return isValid
}

module.exports = SocketApp
