const fs = require('fs-extra')
const path = require('path')

const constants = require('./util/constants')

module.exports = (fileName, cml) => {
  return new Promise((resolve, reject) => {
    const filepath = constants.PATH_PREFIX + fileName
    const dirname = path.dirname(filepath)

    fs.mkdirs(dirname, err => {
      if (err) {
        reject(err)
      } else {
        fs.writeFile(filepath, cml, 'utf8', (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }
    })
  })
}
