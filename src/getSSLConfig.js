const fs = require('fs')
const path = require('path')

const devServerNodeModules = path.resolve(__dirname, '..', 'node_modules')
const certsPath = path.join(devServerNodeModules, 'localhost.daplie.com-certificates')

module.exports = function getSSLConfig() {
  return {
    certificate: fs.readFileSync(path.join(certsPath, 'fullchain.pem'), 'ascii'),
    key: fs.readFileSync(path.join(certsPath, 'privkey.pem'), 'ascii'),
  }
}
