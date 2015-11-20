'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(destPath) {
  function saveFile(opts, res) {
    opts = opts || {};

    if (!opts.fileName) {
      throw new Error('fileName is required');
    }

    var filePath = path.join(destPath, opts.fileName);
    fs.writeFile(filePath, opts.content, function(err) {
      if (err) {
        return console.log(err);
      }

      console.log('The file was saved!');
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received file');
      res.end();
    });
  }

  return function(req, res) {
    if (req.method === 'POST') {
      var jsonString = '';
      req.on('data', function(data) {
        jsonString += data;
      });
      req.on('end', function() {
        saveFile(JSON.parse(jsonString), res);
      });
    }
  };
};
