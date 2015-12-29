'use strict';

const fs = require('fs');
const path = require('path');
const Package = require('./package');
const LocalPackage = require('./local-package');
const async = require('async');
const Registry = require('./registry');
const chalk = require('chalk');
const debug = require('debug')('cdn');

exports.register = function(plugin, opts, next) {
  const mainFields = {
    js: 'main',
    css: 'style'
  };

  let overrides = {};
  if (opts.overridePath) {
    let overridePkg = require(path.join(opts.overridePath, 'package.json'));
    overrides[overridePkg.name] = {
      path: opts.overridePath,
      pkg: overridePkg
    };
  }

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

      function downloadPkgFiles(matchingPkg) {
        if (!matchingPkg) {
          debug('No matching version found for ' +
            chalk.blue(pkgMeta.name + '@' + pkgMeta.version));
          cb(new Error('no matching version found for ' + pkgMeta.name + '@' +
            pkgMeta.version));
          return;
        }
        if (matchingPkg.version !== pkgMeta.version) {
          debug(chalk.blue(pkgMeta.name + '@' + pkgMeta.version) +
            ' resolved to ' +
            chalk.blue(pkgMeta.name + '@' + matchingPkg.version));
        }
        let pkg;
        let isOverriden = !!overrides[pkgMeta.name];
        if (isOverriden) {
          debug('The requested package ' + chalk.blue(pkgMeta.name) +
            ' is overriden locally with ' +
            chalk.magenta(overrides[pkgMeta.name].path));
          pkg = new LocalPackage(overrides[pkgMeta.name].path);
        } else {
          pkg = new Package(pkgMeta.name, matchingPkg.version, {
            registry: opts.registry
          });
        }
        let files = pkgMeta.files;
        if (!files || !files.length) {
          let mainField = mainFields[opts.extension];
          debug('File not specified. Loading main file: ' +
            chalk.magenta(matchingPkg[mainField]));
          let mainFile = matchingPkg[mainField];
          let end = '.' + opts.extension;
          if (mainFile.indexOf(end) === -1) {
            mainFile += end;
          }
          files = [mainFile];
        }
        async.series(files.map(relativeFilePath => function(cb) {
          pkg.readFile(relativeFilePath)
            .then(file => cb(null, opts.transformer({
              content: file,
              pkg: {
                name: pkgMeta.name,
                version: pkgMeta.version,
                filePath: relativeFilePath
              }
            }).content))
            .catch(cb);
        }), function(err, files) {
          if (err) {
            return cb(err);
          }
          cb(null, {
            name: pkgMeta.name,
            version: matchingPkg.version,
            files: files,
            maxAge: isOverriden ?
              0 : plugin.plugins['file-max-age'].getByExtension(opts.extension)
          });
        });
      }

      if (overrides[pkgMeta.name]) {
        downloadPkgFiles(overrides[pkgMeta.name].pkg);
        return;
      }

      registry.resolve(pkgMeta.name, pkgMeta.version)
        .then(downloadPkgFiles)
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

    function downloadFile(matchingPkg) {
      if (matchingPkg.version !== pkgMeta.version) {
        debug(chalk.blue(pkgMeta.name + '@' + pkgMeta.version) +
          ' resolved to ' +
          chalk.blue(pkgMeta.name + '@' + matchingPkg.version));
      }
      let pkg;
      let isOverriden = !!overrides[pkgMeta.name];
      if (isOverriden) {
        debug('The requested package ' + chalk.blue(pkgMeta.name) +
          ' is overriden locally with ' +
          chalk.magenta(overrides[pkgMeta.name].path));
        pkg = new LocalPackage(overrides[pkgMeta.name].path);
      } else {
        pkg = new Package(pkgMeta.name, matchingPkg.version, {
          registry: opts.registry
        });
      }
      pkg.streamFile(pkgMeta.file)
        .then(stream => cb(null, {
          stream: stream,
          maxAge: isOverriden ?
            0 : plugin.plugins['file-max-age'].getByPath(pkgMeta.file)
        }))
        .catch(cb);
    }

    if (overrides[pkgMeta.name]) {
      downloadFile(overrides[pkgMeta.name].pkg);
      return;
    }

    registry.resolve(pkgMeta.name, pkgMeta.version)
      .then(downloadFile)
      .catch(cb);
  });

  next();
};

exports.register.attributes = {
  name: 'bundle-service',
  dependencies: ['file-max-age']
};
