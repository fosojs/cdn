'use strict';

const fs = require('fs');
const path = require('path');
const Package = require('./package');
const LocalPackage = require('./local-package');
const async = require('async');
const Registry = require('./registry');
const chalk = require('chalk');
const debug = require('debug')('cdn');
const R = require('ramda');

exports.register = function(plugin, opts, next) {
  if (!opts.storagePath) {
    return next(new Error('opts.storagePath is required'));
  }

  let storagePath = opts.storagePath;

  const mainFields = {
    js: 'main',
    css: 'style',
  };

  let overrides = {};
  if (opts.overridePath) {
    let overridePkg = require(path.join(opts.overridePath, 'package.json'));
    overrides[overridePkg.name] = {
      path: opts.overridePath,
      pkg: overridePkg,
    };
  }

  function getPackageLoader(pkgMeta, matchingPkg, opts) {
    if (!matchingPkg) {
      debug('No matching version found for ' +
        chalk.blue(pkgMeta.name + '@' + pkgMeta.version));
      return Promise.reject(
        new Error('no matching version found for ' + pkgMeta.name + '@' +
          pkgMeta.version)
      );
    }
    if (matchingPkg.version !== pkgMeta.version) {
      debug(chalk.blue(pkgMeta.name + '@' + pkgMeta.version) +
        ' resolved to ' +
        chalk.blue(pkgMeta.name + '@' + matchingPkg.version));
    }
    let isOverriden = !!overrides[pkgMeta.name];
    if (isOverriden) {
      debug('The requested package ' + chalk.blue(pkgMeta.name) +
        ' is overriden locally with ' +
        chalk.magenta(overrides[pkgMeta.name].path));
      let pkg = new LocalPackage(overrides[pkgMeta.name].path);
      return Promise.resolve({
        pkg,
        isOverriden,
      });
    }
    let pkg = new Package(pkgMeta.name, matchingPkg.version, {
      registry: opts.registry,
      storagePath,
    });
    return Promise.resolve({
      pkg,
      isOverriden,
    });
  }

  function getMatchingPkg(registryClient, pkgMeta) {
    if (overrides[pkgMeta.name]) {
      return Promise.resolve(overrides[pkgMeta.name].pkg);
    }
    return registryClient.resolve(pkgMeta.name, pkgMeta.version);
  }

  function fetchResources(opts) {
    let mpkg;
    let registry = new Registry({
      registry: opts.registry,
    });
    return getMatchingPkg(registry, opts.pkgMeta)
      .then(R.compose(
        matchingPkg => getPackageLoader(opts.pkgMeta, matchingPkg, opts),
        R.tap(value => mpkg = value))
      )
      .then(res => Promise.resolve(R.merge(res, {matchingPkg: mpkg})));
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

    let end = '.' + opts.extension;

    async.series(packages.map(pkgMeta => function(cb) {
      function getMainFile(matchingPkg) {
        let mainField = mainFields[opts.extension];
        let mainFile = matchingPkg[mainField];
        debug('File not specified. Loading main file: ' +
          chalk.magenta(mainFile));
        if (mainFile.indexOf(end) !== -1)
          return mainFile;

        return mainFile + end;
      }

      function getFiles(matchingPkg) {
        if (pkgMeta.files && pkgMeta.files.length)
          return pkgMeta.files;

        return [getMainFile(matchingPkg)];
      }

      fetchResources({
        pkgMeta,
        registry: opts.registry,
      }).then(function(params) {
        let matchingPkg = params.matchingPkg;
        let isOverriden = params.isOverriden;
        let pkg = params.pkg;
        let files = getFiles(matchingPkg);
        async.series(files.map(filePath => function(cb) {
          pkg.readFile(filePath)
            .then(content => cb(null, opts.transformer({
              content,
              pkg: {
                name: matchingPkg.name,
                version: matchingPkg.version,
                filePath,
              },
            }).content))
            .catch(cb);
        }), function(err, files) {
          if (err) {
            return cb(err);
          }
          cb(null, {
            name: matchingPkg.name,
            version: matchingPkg.version,
            files,
            maxAge: isOverriden ?
              0 : plugin.plugins['file-max-age'].getByExtension(opts.extension),
          });
        });
      })
      .catch(cb);
    }), cb);
  });

  plugin.expose('getRaw', function(pkgMeta, opts, cb) {
    opts = opts || {};
    if (!opts.registry) {
      throw new Error('opts.registry is required');
    }

    let isOverriden;
    fetchResources({
      pkgMeta,
      registry: opts.registry,
    })
    .then(R.compose(
      params => params.pkg.streamFile(pkgMeta.file),
      R.tap(params => isOverriden = params.isOverriden)
    ))
    .then(stream => cb(null, {
      stream,
      maxAge: isOverriden ?
        0 : plugin.plugins['file-max-age'].getByPath(pkgMeta.file),
    }))
    .catch(cb);
  });

  next();
};

exports.register.attributes = {
  name: 'bundle-service',
  dependencies: ['file-max-age'],
};
