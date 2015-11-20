'use strict';

var formidable = require('formidable');
var util = require('util');
var path = require('path');
var mkdirp = require('mkdirp');
var unpack = require('../utils/unpack');

module.exports = function(destPath) {
  var tmpPath = path.join(destPath, './tmp');
  mkdirp.sync(tmpPath);

  return function(req, res) {
    if (req.method.toLowerCase() !== 'post') {
      return;
    }
    var form = new formidable.IncomingForm();
    var version;
    var name;

    form.on('fileBegin', function(name, file) {
      file.path = path.join(tmpPath, file.name);
    });

    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));

      version = fields.version;
      name = fields.name;
    });

    form.on('end', function(fields, files) {
      var file = this.openedFiles[0];
      unpack(file, {
        version: version,
        name: name,
        tmpPath: tmpPath,
        destPath: destPath
      });
    });
  };
};
