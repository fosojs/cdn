'use strict';

var R = require('ramda');

function parseNameVersion(nv) {
  var parts = nv.split('@');
  return {
    name: parts[0],
    version: parts[1] || '*',
    files: ['index.js']
  };
}

module.exports = function(url) {
  var packageNames = url.split(',');
  var packages = packageNames.map(function(pn) {
    if (pn.indexOf('|') !== -1) {
      var parts = pn.split('|');
      var filesPart = parts[1];
      return R.merge(parseNameVersion(parts[0]), {
        files: filesPart.split(';')
      });
    }
    return parseNameVersion(pn);
  });

  return packages;
};
