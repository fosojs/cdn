'use strict'
module.exports = localPackage

const path = require('path')
const fs = require('fs')
const streamToString = require('stream-to-string')

function localPackage (src) {
  return {
    readFile,
    streamFile,
  }

  function readFile (filename) {
    return streamFile(filename).then(streamToString)
  }

  function streamFile (filename) {
    const file = path.resolve(src, filename)

    if (!fs.existsSync(file)) {
      return Promise.reject(new Error('File not found: ' + file))
    }

    return Promise.resolve(fs.createReadStream(file))
  }
}
