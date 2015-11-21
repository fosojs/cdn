'use strict';

var fs = require('fs');
var path = require('path');

exports.register = function(server, opts, next) {
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

        return reply('received file').type('text/plain');
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/publish-file'
};
