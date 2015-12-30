'use strict';

const path = require('path');
const fs = require('fs');
const streamToString = require('stream-to-string');

function LocalPackage(src) {
  this._src = src;
}

LocalPackage.prototype.readFile = function(filename) {
  return this.streamFile(filename).then(streamToString);
};

LocalPackage.prototype.streamFile = function(filename) {
  return new Promise(function(resolve, reject) {
    let file = path.resolve(this._src, filename);

    if (!fs.existsSync(file)) {
      return reject(new Error('File not found: ' + file));
    }

    return resolve(fs.createReadStream(file));
  }.bind(this));
};

module.exports = LocalPackage;
