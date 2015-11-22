'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var unpack = require('./unpack');

exports.register = function(server, opts, next) {
  mkdirp.sync(opts.tempPath);

  server.route({
    method: 'POST',
    path: '/publish',
    config: {
      payload: {
        output: 'file',
        maxBytes: 1048576 * 10, /* 10MB */
        uploads: opts.tempPath
      }
    },
    handler: function(req, reply) {
      unpack(req.payload.file, {
        version: req.payload.version,
        name: req.payload.name,
        destPath: opts.storagePath
      });

      return reply({
        message: 'received upload'
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/publish-file',
    handler: function(req, reply) {
      if (!req.payload.fileName) {
        throw new Error('fileName is required');
      }

      var filePath = path.join(opts.storagePath, req.payload.fileName);
      fs.writeFile(filePath, req.payload.content, function(err) {
        if (err) {
          return console.log(err);
        }

        console.log('The file was saved!');

        return reply({
          message: 'received file'
        });
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/publish'
};
