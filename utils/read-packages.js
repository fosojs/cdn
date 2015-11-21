'use strict';

var fs = require('fs');
var path = require('path');
var getPackageVersions = require('./get-package-versions');
var semver = require('semver');
var config = require('../config');

function getMatchingVersion(pkgName, versionPattern) {
  var versions = getPackageVersions(pkgName);
  for (var index in versions) {
    if (semver.satisfies(versions[index], versionPattern)) {
      return versions[index];
    }
  }
}

module.exports = function(destPath, packages) {
  var bundle = 'window.ung=window.ung||{};ung.packages=ung.packages||{};ung.origin="' + config.ip + ':' + config.port + '"';
  packages.forEach(function(pkg) {
    var matchingVersion = getMatchingVersion(pkg.name, pkg.version);
    if (!matchingVersion) {
      throw new Error('No matching version found');
    }
    bundle += ';ung.packages["' + pkg.name + '"]={version:"' + matchingVersion + '"};';
    var pkgPath = path.join(destPath, pkg.name, matchingVersion);
    pkg.files.forEach(function(relativeFilePath) {
      var filePath = path.join(pkgPath, relativeFilePath);
      bundle += fs.readFileSync(filePath, {encoding: 'utf-8'});
    });
  });
  return bundle;
};
