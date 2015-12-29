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
        isOverriden
      });
    }
    let pkg = new Package(pkgMeta.name, matchingPkg.version, {
      registry: opts.registry
    });
    return Promise.resolve({
      pkg,
      isOverriden
    });
  }

  let getMatchingPkg = function(registryClient, pkgMeta) {
    if (overrides[pkgMeta.name]) {
      return Promise.resolve(overrides[pkgMeta.name].pkg);
    }
    return registryClient.resolve(pkgMeta.name, pkgMeta.version);
  };

  function fetchResources(opts) {
    let mpkg;
    let registry = new Registry({
      registry: opts.registry
    });
    return getMatchingPkg(registry, opts.pkgMeta)
      .then(function(matchingPkg) {
        mpkg = matchingPkg;
        return getPackageLoader(opts.pkgMeta, matchingPkg, opts);
      })
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

    async.series(packages.map((pkgMeta) => function(cb) {
      fetchResources({
        pkgMeta,
        registry: opts.registry,
      }).then(function(params) {
        let matchingPkg = params.matchingPkg;
        let isOverriden = params.isOverriden;
        let pkg = params.pkg;
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
              0 : plugin.plugins['file-max-age'].getByExtension(opts.extension)
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

    fetchResources({
      pkgMeta,
      registry: opts.registry,
    })
    .then(function(params) {
      let isOverriden = params.isOverriden;
      let pkg = params.pkg;
      pkg.streamFile(pkgMeta.file)
        .then(stream => cb(null, {
          stream,
          maxAge: isOverriden ?
            0 : plugin.plugins['file-max-age'].getByPath(pkgMeta.file)
        }))
        .catch(cb);
    })
    .catch(cb);
  });

  next();
};

exports.register.attributes = {
  name: 'bundle-service',
  dependencies: ['file-max-age']
};
