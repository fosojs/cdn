'use strict';

var R = require('ramda');

function parse(url, fileExt) {
  if (!url) {
    throw new Error('url is required');
  }
  if (!fileExt) {
    throw new Error('fileExt is required');
  }

  function parseNameVersion(nv) {
    var parts = nv.split('@');
    return {
      name: parts[0],
      version: parts[1] || '*',
      files: ['index.' + fileExt]
    };
  }

  var packageNames = url.split(',');
  var packages = packageNames.map(function(pn) {
    if (pn.indexOf('!') !== -1) {
      var parts = pn.split('!');
      var filesPart = parts[1];
      return R.merge(parseNameVersion(parts[0]), {
        files: filesPart.split(';').map(function(filePath) {
          var end = '.' + fileExt;
          return filePath.endsWith(end) ? filePath : filePath + end;
        })
      });
    }
    return parseNameVersion(pn);
  });

  return packages;
}

module.exports = parse;
