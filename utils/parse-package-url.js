'use strict';

module.exports = function(url) {
  var packageNames = url.split(',');
  var packages = packageNames.map(function(pn) {
    var parts = pn.split('@');
    return {
      name: parts[0],
      version: parts[1]
    };
  });

  return packages;
};
