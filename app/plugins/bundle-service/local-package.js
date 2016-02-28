'use strict'
module.exports = LocalPackage

const path = require('path')
const fs = require('fs')
const streamToString = require('stream-to-string')

function LocalPackage (src) {
  this._src = src
}

LocalPackage.prototype.readFile = function (filename) {
  return this.streamFile(filename).then(streamToString)
}

LocalPackage.prototype.streamFile = function (filename) {
  const file = path.resolve(this._src, filename)

  if (!fs.existsSync(file)) {
    return Promise.reject(new Error('File not found: ' + file))
  }

  return Promise.resolve(fs.createReadStream(file))
}
