'use strict';

var path = require('path');
var chalk = require('chalk');
var packer = require('dir-packer');

function unpack(file, opts) {
  opts = opts || {};

  if (!opts.destPath) {
    throw new Error('opts.destPath is required');
  }
  if (!opts.name) {
    throw new Error('opts.name is required');
  }
  if (!opts.version) {
    throw new Error('opts.version is required');
  }

  var packPath = file.path;

  console.log('Received package ' + opts.name);

  var dest = path.join(opts.destPath, opts.name, opts.version);

  packer.unpack(packPath, dest)
    .then(function() {
      console.log(chalk.magenta(opts.name + '@' + opts.version) + ' published');
    })
    .catch(function(err) {
      console.log(err);
    });
}

module.exports = unpack;
