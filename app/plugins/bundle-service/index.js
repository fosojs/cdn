'use strict';

var fs = require('fs');
var path = require('path');
var semver = require('semver');

exports.register = function(plugin, opts, next) {
  if (!opts.storagePath) {
    return next(new Error('opts.storagePath is required'));
  }
  if (!opts.resourcesHost) {
    return next(new Error('opts.resourcesHost is required'));
  }

  function getPackageVersions(packageName) {
    var pkgPath = path.join(opts.storagePath, packageName);
    var versions = fs.readdirSync(pkgPath);
    return versions.sort(function(a, b) {
      if (semver.lt(a, b)) {
        return 1;
      } else {
        return -1;
      }
    });
  }

  function getMatchingVersion(pkgName, versionPattern) {
    var versions = getPackageVersions(pkgName);
    for (var index in versions) {
      if (semver.satisfies(versions[index], versionPattern)) {
        return versions[index];
      }
    }
  }

  plugin.expose('get', function(packages) {
    var bundle = 'window.ung=window.ung||{skippedPackages:[]};ung.packages=ung.packages||{};ung.origin="' + opts.resourcesHost + '"';
    packages.forEach(function(pkg) {
      var matchingVersion = getMatchingVersion(pkg.name, pkg.version);
      if (!matchingVersion) {
        throw new Error('No matching version found');
      }
      bundle += ';ung.packages["' + pkg.name + '"]={version:"' + matchingVersion + '"};';
      var pkgPath = path.join(opts.storagePath, pkg.name, matchingVersion);
      pkg.files.forEach(function(relativeFilePath) {
        var filePath = path.join(pkgPath, relativeFilePath);
        bundle += 'if (ung.skippedPackages.indexOf("' + pkg.name + '") === -1) {';
        bundle += fs.readFileSync(filePath, {encoding: 'utf-8'});
        bundle += '}';
      });
    });
    return bundle;
  });

  next();
};

exports.register.attributes = {
  name: 'bundle-service'
};
