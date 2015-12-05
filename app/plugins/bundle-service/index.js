'use strict';

var fs = require('fs');
var path = require('path');
var Package = require('./package');
var async = require('async');
const registry = require('./registry');

exports.register = function(plugin, opts, next) {
  plugin.expose('get', function(packages, cb) {
    async.series(packages.map((pkgMeta) => function(cb) {
      registry.resolve(pkgMeta.name, pkgMeta.version)
        .then(function(matchingVersion) {
          if (matchingVersion !== pkgMeta.version) {
            console.log(pkgMeta.name + '@' + pkgMeta.version + ' resolved to ' +
              pkgMeta.name + '@' + matchingVersion);
          }
          var pkg = new Package(pkgMeta.name, matchingVersion, {
            verbose: true
          });
          async.series(pkgMeta.files.map(relativeFilePath => function(cb) {
            pkg.readFile(relativeFilePath)
              .then(file => cb(null, file))
              .catch(cb);
          }), function(err, files) {
            if (err) {
              return cb(err);
            }
            cb(null, {
              name: pkgMeta.name,
              version: matchingVersion,
              files: files
            });
          });
        })
        .catch(cb);
    }), function(err, packageFiles) {
      cb(err, packageFiles);
    });
  });

  plugin.expose('getRaw', function(pkgMeta, cb) {
    registry.resolve(pkgMeta.name, pkgMeta.version)
      .then(function(matchingVersion) {
        if (matchingVersion !== pkgMeta.version) {
          console.log(pkgMeta.name + '@' + pkgMeta.version + ' resolved to ' +
            pkgMeta.name + '@' + matchingVersion);
        }
        var pkg = new Package(pkgMeta.name, matchingVersion, {
          verbose: true
        });
        pkg.streamFile(pkgMeta.file)
          .then(stream => cb(null, stream))
          .catch(cb);
      })
      .catch(cb);
  });

  next();
};

exports.register.attributes = {
  name: 'bundle-service'
};
