'use strict';

const fs = require('fs');
const path = require('path');
const Package = require('./package');
const async = require('async');
const Registry = require('./registry');

exports.register = function(plugin, opts, next) {
  const mainFields = {
    js: 'main',
    css: 'style'
  };

  plugin.expose('get', function(packages, opts, cb) {
    opts = opts || {};
    if (!opts.registry) {
      throw new Error('opts.registry is required');
    }
    if (!opts.extension) {
      throw new Error('opts.extension is required');
    }
    if (!opts.transformer) {
      throw new Error('opts.transformer is required');
    }

    let registry = new Registry({
      registry: opts.registry
    });

    async.series(packages.map((pkgMeta) => function(cb) {
      registry.resolve(pkgMeta.name, pkgMeta.version)
        .then(function(matchingPkg) {
          if (!matchingPkg) {
            console.log('No matching version found for', pkgMeta.name + '@' +
              pkgMeta.version);
            cb(new Error('no matching version found for ' + pkgMeta.name + '@' +
              pkgMeta.version));
            return;
          }
          if (matchingPkg.version !== pkgMeta.version) {
            console.log(pkgMeta.name + '@' + pkgMeta.version + ' resolved to ' +
              pkgMeta.name + '@' + matchingPkg.version);
          }
          var pkg = new Package(pkgMeta.name, matchingPkg.version, {
            verbose: true,
            registry: opts.registry
          });
          var files = pkgMeta.files;
          if (!files || !files.length) {
            let mainField = mainFields[opts.extension];
            console.log('File not specified. Loading main file:',
              matchingPkg[mainField]);
            let mainFile = matchingPkg[mainField];
            let end = '.' + opts.extension;
            if (mainFile.indexOf(end) === -1) {
              mainFile += end;
            }
            files = [mainFile];
          }
          async.series(files.map(relativeFilePath => function(cb) {
            pkg.readFile(relativeFilePath)
              .then(file => cb(null, opts.transformer(file)))
              .catch(cb);
          }), function(err, files) {
            if (err) {
              return cb(err);
            }
            cb(null, {
              name: pkgMeta.name,
              version: matchingPkg.version,
              files: files
            });
          });
        })
        .catch(cb);
    }), function(err, packageFiles) {
      cb(err, packageFiles);
    });
  });

  plugin.expose('getRaw', function(pkgMeta, opts, cb) {
    opts = opts || {};
    if (!opts.registry) {
      throw new Error('opts.registry is required');
    }

    let registry = new Registry({
      registry: opts.registry
    });

    registry.resolve(pkgMeta.name, pkgMeta.version)
      .then(function(matchingPkg) {
        if (matchingPkg.version !== pkgMeta.version) {
          console.log(pkgMeta.name + '@' + pkgMeta.version + ' resolved to ' +
            pkgMeta.name + '@' + matchingPkg.version);
        }
        var pkg = new Package(pkgMeta.name, matchingPkg.version, {
          verbose: true,
          registry: opts.registry
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
