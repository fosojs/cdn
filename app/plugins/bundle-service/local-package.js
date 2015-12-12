'use strict';

const path = require('path');
const fs = require('fs');

function LocalPackage(src) {
  this._src = src;
}

LocalPackage.prototype.readFile = function(filename) {
  return new Promise(function(resolve, reject) {
    this.streamFile(filename)
      .then(function(stream) {
        stream.setEncoding('utf8');
        var file = '';
        stream.on('data', (chunk) => file += chunk);
        stream.on('end', () => resolve(file));
      })
      .catch(reject);
  }.bind(this));
};

LocalPackage.prototype.streamFile = function(filename) {
  return new Promise(function(resolve, reject) {
    var self = this;

    var file = path.resolve(this._src, filename);

    if (!fs.existsSync(file)) {
      return reject(new Error('File not found: ' + file));
    }

    return resolve(fs.createReadStream(file));
  }.bind(this));
};

module.exports = LocalPackage;
