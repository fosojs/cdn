'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(destPath, packages) {
  var bundle = '';
  packages.forEach(function(pkg) {
    var pkgPath = path.join(destPath, pkg.name, pkg.version, './index.js');
    bundle += fs.readFileSync(pkgPath, {encoding: 'utf-8'});
  });
  return bundle;
};
