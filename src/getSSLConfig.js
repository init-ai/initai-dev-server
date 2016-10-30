'use strict'

const fs = require('fs')
const path = require('path')

const nestedModulesPath = path.resolve(__dirname, '..', 'node_modules')
const flattenedModulesPath = path.resolve(__dirname, '..', '..', '..', 'node_modules') // for NPM 3+

module.exports = function getSSLConfig() {
  // Assume NPM2, which nests node_modules
  let certsPath = path.join(nestedModulesPath, 'localhost.daplie.com-certificates')
  try {
    fs.accessSync(path.join(certsPath, 'fullchain.pem'), fs.R_OK)
    fs.accessSync(path.join(certsPath, 'privkey.pem'), fs.R_OK)
  } catch (e) {
    // Assume NPM3
    certsPath = path.join(flattenedModulesPath, 'localhost.daplie.com-certificates')
    fs.accessSync(path.join(certsPath, 'fullchain.pem'), fs.R_OK)
    fs.accessSync(path.join(certsPath, 'privkey.pem'), fs.R_OK)
    // If this is not reached due to exception from accessSync, then there was a filesystem issue or missing NPM modules
  }
  return {
    certificate: fs.readFileSync(path.join(certsPath, 'fullchain.pem'), 'ascii'),
    key: fs.readFileSync(path.join(certsPath, 'privkey.pem'), 'ascii'),
  }
}
