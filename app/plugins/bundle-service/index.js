'use strict';

var fs = require('fs');
var path = require('path');
var semver = require('semver');
var Package = require('./package');
var async = require('async');

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

  plugin.expose('get', function(packages, cb) {
    var bundle = 'window.ung=window.ung||{skippedPackages:[]};ung.packages=ung.packages||{};ung.origin="' + opts.resourcesHost + '"';
    async.each(packages, function(pkgMeta, cb) {
      var matchingVersion = pkgMeta.version;//getMatchingVersion(pkg.name, pkg.version);
      if (!matchingVersion) {
        throw new Error('No matching version found');
      }
      bundle += ';ung.packages["' + pkgMeta.name + '"]={version:"' + matchingVersion + '"};';
      var pkg = new Package(pkgMeta.name, pkgMeta.version, {
        verbose: true
      });
      var pkgPath = path.join(opts.storagePath, pkgMeta.name, matchingVersion);
      async.each(pkgMeta.files, function(relativeFilePath, cb) {
        pkg.readFile(relativeFilePath)
          .then(function(file) {
            bundle += 'if (ung.skippedPackages.indexOf("' + pkgMeta.name + '") === -1) {';
            bundle += file;
            bundle += '}';
            cb();
          })
          .catch(cb);
      }, cb);
    }, function(err) {
      cb(err, bundle);
    });
  });

  next();
};

exports.register.attributes = {
  name: 'bundle-service'
};
