'use strict'

const os = require('os')

const emune = require('emune')

const Environments = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
  TEST: 'test',
}

const Errors = {
  FILE_NOT_FOUND: 'The given file was not found.',
  GENERATOR: 'The generator failed to process your request.',
  PARSER: 'The parser failed to process your request.',
  PARSER_RESPONSE_INVALID: 'The parser returned a non-JSON output.',
  WALKER: 'The file system walker encountered an error.',
}

const SocketEvents = Object.assign({},
  emune([
    'CONVERSATION_DATA',
    'CONVERT_JSON_TO_CML',
    'ERROR',
    'FILE_CHANGED',
    'LOCAL_TESTER_STARTED',
    'LOCAL_TESTER_STOPPED',
    'REQUEST_CLI_STATE',
    'REQUEST_CONVERSATION_DATA',
    'REQUEST_LOCAL_TESTING_CREDENTIALS',
    'REQUEST_LOCAL_TESTER_START',
    'REQUEST_LOCAL_TESTER_STOP',
  ]),
  {DISCONNECT: 'disconnect'}
)

const OriginList = [
  'http://localhost',
  'http://s-csi.init.ai.s3-website-us-east-1.amazonaws.com',
  'https://p-csi.init.ai',
  'https://csi.init.ai',
]

const Origins = {
  CORS: {
    ALL: OriginList.map(origin => {
      return (origin.indexOf('localhost') !== -1) ? (
        origin += ':3045'
      ) : origin
    }),
  },
  Sockets: {
    ALL: OriginList.map(origin => origin + ':*'),
  },
}

function getCMLBinary() {
  switch (os.platform()) {
    case 'win32':
      return 'cml-windows.exe'
    case 'linux':
      return 'cml-linux'
    default:
      return 'cml'
  }
}

const CML_BINARY = getCMLBinary()
const PATH_PREFIX = 'language/conversations/'
const URL_PATH_REGEX = /language\/conversations\/(.*)/
const FILE_PATH_REGEX = os.platform() === 'win32' ? /language\\conversations\\(.*)/ : URL_PATH_REGEX
const ROLLBAR_KEY = '0c840d94cb08418fa26681fa4cc03784'

const CHILD_PROCESS_TIMEOUT = process.env.NODE_ENV === Environments.TEST ? 500 : 10000

const PusherAppId = {}
PusherAppId[Environments.DEVELOPMENT] = '2d0a11e18b2c5d7b0128'
PusherAppId[Environments.STAGING] = 'ce5c19b1b1625e9abace'
PusherAppId[Environments.PRODUCTION] = '843e8669f81757d7abc3'

const PusherEvents = {
  LOGIC_RESULT: 'client-logic:result',
  LOGIC_INVOCATION: 'logic:invocation',
}

const ApiBaseUrl = {}
ApiBaseUrl[Environments.DEVELOPMENT] = 'http://localhost:8081/api/v1'
ApiBaseUrl[Environments.STAGING] = 'https://s-api.init.ai/api/v1'
ApiBaseUrl[Environments.PRODUCTION] = 'https://api.init.ai/api/v1'

const Messages = {
  Sender: {
    SYSTEM: 'app',
    USER: 'user',
  },
}

const Classifications = {
  Direction: {
    'app': 'outbound',
    'user': 'inbound',
  },
}

module.exports = {
  CML_BINARY,
  CHILD_PROCESS_TIMEOUT,
  FILE_PATH_REGEX,
  LOG_LEVEL: {
    VERBOSE: 'verbose',
  },
  LOG_TYPES: {
    ACTION: 'logAction',
    MESSAGE: 'logMessage',
  },
  PATH_PREFIX,
  ROLLBAR_KEY,
  URL_PATH_REGEX,
  ApiBaseUrl,
  Classifications,
  Environments,
  Errors,
  Messages,
  OriginList,
  Origins,
  PusherAppId,
  PusherEvents,
  SocketEvents,
}
