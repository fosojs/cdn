'use strict';

var fs = require('fs');
var path = require('path');
var config = require('../../config');
var semver = require('semver');

function getPackageVersions(packageName) {
  var pkgPath = path.join(config.storagePath, packageName);
  var versions = fs.readdirSync(pkgPath);
  return versions.sort(function(a, b) {
    if (semver.lt(a, b)) {
      return 1;
    } else {
      return -1;
    }
  });
}

module.exports = getPackageVersions;
