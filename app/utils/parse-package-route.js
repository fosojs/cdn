'use strict';

var R = require('ramda');

function parsePackageRoute(packageRoute, extension) {
  var end = '.' + extension;

  function parseNameVersion(nv) {
    let prefix;
    if (nv[0] === '@') {
      prefix = '@';
      nv = nv.slice(1);
    } else {
      prefix = '';
    }
    var parts = nv.split('@');
    return {
      name: prefix + parts[0],
      version: parts[1] || '*'
    };
  }
/*
  if (packageRoute.startsWith('@')) {
    return packageRoute.substr(1);
  }*/
  if (packageRoute.indexOf('(') !== -1) {
    var parts = packageRoute.split('(');
    var filesPart = parts[1].substr(0, parts[1].length - 1);
    return R.merge(parseNameVersion(parts[0]), {
      files: filesPart.split('+').map(function(filePath) {
        return filePath.endsWith(end) ? filePath : filePath + end;
      })
    });
  }
  return parseNameVersion(packageRoute);
}

module.exports = parsePackageRoute;
