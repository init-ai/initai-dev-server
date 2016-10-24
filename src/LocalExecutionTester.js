'use strict'

const childProcess = require('child_process')
const path = require('path')
const request = require('request')

const chalk = require('chalk')
const Pusher = require('pusher-js/node')
const stringify = require('json-stringify-pretty-compact')

const constants = require('./util/constants')
const logger = require('./util/logger')

class LocalExecutionTester {
  constructor(config) {
    this.appId = config.appId
    this.appUserId = config.testAppUser.id
    this.environment = config.environment || process.env.NODE_ENV
    this.apiBaseUrl = constants.ApiBaseUrl[this.environment]
    this.jwtToken = config.jwtToken
    this.remoteToken = config.remoteToken
    this.projectSourcePath = config.projectSourcePath || path.resolve('.')

    // Pusher specific properties
    this.channel = null
    this.channelNonce = null

    this.logicInvocationEventHandler = this.handleLogicInvocationEvent.bind(this)

    this.configurePusher()
    this.configureAPIForTesting()
  }

  configurePusher() {
    const pusherAppId = constants.PusherAppId[this.environment]

    this.pusher = new Pusher(pusherAppId, {
      encrypted: true,
      auth: {
        params: {},
        headers: {
          authorization: `Bearer ${this.jwtToken}`,
        },
      },
      authEndpoint: `${this.apiBaseUrl}/manage/apps/${this.appId}/auth_pusher_channel_for_self`,
    })
  }

  configureAPIForTesting() {
    const url = `${this.apiBaseUrl}/config/${this.appId}/logic/redirect_for_self`

    logger.log('Contacting API to initiate redirect', url)

    request({
      url: url,
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.jwtToken}`,
      },
    }, (err, res, body) => {
      if (err) {
        logger.logError(err)
        throw new Error(err)
      }

      if (res.statusCode !== 200) {
        logger.logError(body)
        throw new Error(body)
      }

      this.connectToPusher(JSON.parse(body).body.destination_id)
    })
  }

  connectToPusher(destinationChannel) {
    const parsedChannel = /^presence-([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})-([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})-(\w+)$/.exec(destinationChannel)

    if (!this.appUserId) {
      this.appUserId = parsedChannel[2]
    }

    this.channelNonce = parsedChannel[3]

    if (this.channel) {
      logger.log('Disconnecting from previous channel')
      this.pusher.unsubscribe(this.channel.name)
    }

    const channelName = `presence-${this.appId}-${this.appUserId}-${this.channelNonce}`

    this.channel = this.pusher.subscribe(channelName)

    this.channel.bind(constants.PusherEvents.LOGIC_INVOCATION, this.logicInvocationEventHandler)

    logger.log('Connected and waiting for invocations...')
  }

  handleLogicInvocationEvent(payload) {
    const url = `${this.apiBaseUrl}/remote/logic/invocations/${payload.invocation_id}/payload`

    this.requestEventPayloadFromAPI(url, payload, (err, res, body) => {
      if (err) {
        logger.logError(err)
        throw new Error(err)
      }

      if (res.statusCode !== 200) {
        if (res.statusCode === 404) {
          logger.logError(`Failed to fetch ${url}. Proper authorization is required.`)
        } else {
          logger.logError(body)
        }
      } else {
        const eventData = JSON.parse(body).body.payload

        this.processInvocation(eventData, (result) => {
          const payload = {
            invocation: {
              invocation_id: eventData.payload.execution_data.execution_id,
              app_id: eventData.payload.current_application.id,
              app_user_id: eventData.payload.current_conversation.__private_temp_user_id,
            },
            result: result,
          }
          const triggerResult = this.channel.trigger(constants.PusherEvents.LOGIC_RESULT, payload)

          if (!triggerResult) {
            logger.logError('Failed to send event over channel', {
              event: constants.PusherEvents.LOGIC_RESULT,
              payload: payload,
            })
          }
        })
      }
    })
  }

  requestEventPayloadFromAPI(url, payload, callback) {
    request({
      url,
      method: 'GET',
      headers: {
        authorization: `Bearer ${this.remoteToken}`,
      },
    }, callback)
  }

  processInvocation(payload, callback) {
    const wrapperPath = path.resolve(__dirname, 'invocationWrapper.js')

    logger.logClean('\n')
    logger.logClean(chalk.blue('------------------------------------------------------------'))
    logger.logClean(chalk.blue.bold('[LOGS]\n'))

    const child = childProcess.fork(wrapperPath, [this.projectSourcePath, JSON.stringify(payload)])

    const childProcessTimeout = setTimeout(() => {
      logger.logWarning('Killing child process after timeout')

      child.kill()
    }, constants.CHILD_PROCESS_TIMEOUT)

    child.on('message', (data) => {
      clearTimeout(childProcessTimeout)

      let result = data.result

      logger.logClean(chalk.blue('------------------------------------------------------------\n'))

      if (data.message === 'succeed') {
        logger.logClean('\n')
        logger.logClean(chalk.green('------------------------------------------------------------'))
        logger.logClean(chalk.green.bold('[RESULTS]\n'))
        logger.logClean(chalk.gray.underline('conversation state:'))
        logger.logClean(stringify(result.payload.conversation_state, {maxLength: 60}))
        logger.logClean('\n')
        logger.logClean(chalk.gray.underline('response:'))
        result.payload.messages.forEach(message => {
          logger.logClean(stringify(message, {maxLength: 60}))
        })
        logger.logClean(chalk.green('------------------------------------------------------------'))

        callback(result)
      } else {
        result = JSON.parse(result)

        logger.logClean(chalk.red('------------------------------------------------------------'))
        logger.logClean('\n')
        logger.logClean(result)
        logger.logClean(chalk.red('------------------------------------------------------------'))
      }

      logger.logClean('\n')
      logger.log('Awaiting next message...')
    })

    child.on('exit', () => {
      clearTimeout(childProcessTimeout)
    })

    child.on('close', () => {
      clearTimeout(childProcessTimeout)
    })

    child.on('error', (err) =>{
      logger.logError('Script execution failed:', err)
      clearTimeout(childProcessTimeout)
    })

    child.on('disconnect', () =>{
      clearTimeout(childProcessTimeout)
    })
  }

  destroy() {
    this.pusher.disconnect()
    this.pusher = null
  }
}

module.exports = LocalExecutionTester
module.exports.create = (payload) => new LocalExecutionTester(payload)
