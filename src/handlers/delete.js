const fs = require('fs')
const constants = require('../util/constants')

module.exports = (request, response) => {
  const path = constants.PATH_PREFIX + request.params[0]

  fs.unlink(path, err => {
    if (err) {
      response.status(404)
    } else {
      response.status(204)
    }
    response.end()
  })
}
