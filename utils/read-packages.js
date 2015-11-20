'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(destPath, packages) {
  var bundle = 'window.ungPackages = window.ungPackages || {};';
  packages.forEach(function(pkg) {
    bundle += ';ungPackages["' + pkg.name + '"]="' + pkg.version + '";';
    var pkgPath = path.join(destPath, pkg.name, pkg.version);
    pkg.files.forEach(function(relativeFilePath) {
      var filePath = path.join(pkgPath, relativeFilePath);
      bundle += fs.readFileSync(filePath, {encoding: 'utf-8'});
    });
  });
  return bundle;
};
