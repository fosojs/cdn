'use strict';

var path = require('path');
var mkdirp = require('mkdirp');
var unpack = require('../utils/unpack');

exports.register = function(server, opts, next) {
  var tmpPath = path.join(opts.storagePath, './tmp');
  mkdirp.sync(tmpPath);

  server.route({
    method: 'POST',
    path: '/publish',
    config: {
      payload: {
        output: 'file',
        maxBytes: 1048576 * 10, /* 10MB */
        uploads: tmpPath
      }
    },
    handler: function(req, reply) {
      unpack(req.payload.file, {
        version: req.payload.version,
        name: req.payload.name,
        tmpPath: tmpPath,
        destPath: opts.storagePath
      });

      return reply('received upload').type('text/plain');
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/publish'
};
