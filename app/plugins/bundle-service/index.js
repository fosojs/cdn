'use strict';

var fs = require('fs');
var path = require('path');
var Package = require('./package');
var async = require('async');
const registry = require('./registry');

exports.register = function(plugin, opts, next) {
  if (!opts.storagePath) {
    return next(new Error('opts.storagePath is required'));
  }
  if (!opts.resourcesHost) {
    return next(new Error('opts.resourcesHost is required'));
  }

  plugin.expose('get', function(packages, cb) {
    var bundle = 'window.ung=window.ung||{skippedPackages:[]};' +
      'ung.packages=ung.packages||{};ung.origin="' + opts.resourcesHost + '"';
    async.each(packages, function(pkgMeta, cb) {
      registry.resolve(pkgMeta.name, pkgMeta.version)
        .then(function(matchingVersion) {
          if (matchingVersion !== pkgMeta.version) {
            console.log(pkgMeta.name + '@' + pkgMeta.version + ' resolved to ' +
              pkgMeta.name + '@' + matchingVersion);
          }
          bundle += ';ung.packages["' + pkgMeta.name +
            '"]={version:"' + matchingVersion + '"};';
          var pkg = new Package(pkgMeta.name, matchingVersion, {
            verbose: true
          });
          async.each(pkgMeta.files, function(relativeFilePath, cb) {
            pkg.readFile(relativeFilePath)
              .then(function(file) {
                bundle += 'if (ung.skippedPackages.indexOf("' +
                  pkgMeta.name + '") === -1) {';
                bundle += file;
                bundle += '}';
                cb();
              })
              .catch(cb);
          }, cb);
        })
        .catch(cb);
    }, function(err) {
      cb(err, bundle);
    });
  });

  next();
};

exports.register.attributes = {
  name: 'bundle-service'
};
