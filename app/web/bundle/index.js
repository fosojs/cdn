'use strict';

const parseBundleRoute = require('../../utils/parse-bundle-route');
const Boom = require('boom');
const uglify = require('uglify-js');
const CleanCSS = require('clean-css');
var config = require('../../../config');

exports.register = function(server, opts, next) {
  if (!opts.resourcesHost) {
    return next(new Error('opts.resourcesHost is required'));
  }

  var refService = server.plugins['reference-service'];

  var extContentType = {
    js: 'text/javascript',
    css: 'text/css'
  };

  function pathsToPkgs(paths, extension) {
    var packages = [];
    paths.forEach(function(path) {
      if (typeof path === 'object') {
        packages.push(path);
        return;
      }
      packages = packages.concat(referenceToPkgs(path, extension));
    });
    return packages;
  }

  function referenceToPkgs(refName, extension) {
    var referencePackages = refService.get(refName + '.' + extension);
    return pathsToPkgs(referencePackages, extension);
  }

  function bundleToPkgs(bundle) {
    var packages = pathsToPkgs(bundle.paths, bundle.extension);
    /*packages.forEach(function(pkg) {
      if (!pkg.files || !pkg.files.length) {
        pkg.files = ['index.' + bundle.extension];
      }
    });*/
    return packages;
  }

  function bundleFiles(type, pkgFiles) {
    if (type === 'js') {
      var bundle = 'window.ung=window.ung||{skippedPackages:[]};' +
        'ung.packages=ung.packages||{};ung.origin="' + opts.resourcesHost + '"';
      bundle += pkgFiles.reduce(function(memo, pkgFiles) {
        return memo + ';ung.packages["' + pkgFiles.name +
          '"]={version:"' + pkgFiles.version + '"};' +
          'if (ung.skippedPackages.indexOf("' +
          pkgFiles.name + '") === -1) {' +  pkgFiles.files.join('') +
          '}';
      }, '');
      return bundle;
    }
    return pkgFiles.reduce(function(memo, pkgFiles) {
      return memo + pkgFiles.files.join('');
    }, '');
  }

  var bundleCache = server.cache({
    //cache: 'redisCache',
    expiresIn: 1000 * 60 * 5,
    generateFunc: function(id, next) {
      var packages = bundleToPkgs(id);

      var transformer;
      if (id.options.indexOf('min') !== -1) {
        if (id.extension === 'js') {
          transformer = code => uglify.minify(code, {fromString: true}).code;
        } else {
          transformer = code => new CleanCSS().minify(code).styles;
        }
      } else {
        transformer = code => code;
      }
      server.plugins['bundle-service']
        .get(packages, {
          extension: id.extension,
          transformer: transformer,
          registry: id.registry
        }, function(err, pkgFiles) {
          if (err) {
            return next(null, null);
          }
          var content = bundleFiles(id.extension, pkgFiles);
          next(null, content);
        });
    },
    generateTimeout: 1000 * 10 /* 10 seconds */
  });

  function bundleHandler(req, reply) {
    let registry;
    if (req.params.account) {
      if (config.accounts && config.accounts[req.params.account]) {
        registry = config.accounts[req.params.account].registry;
      } else {
        return reply(Boom.notFound('Passed account not found'));
      }
    } else {
      registry = config.registry;
    }

    var bundle = parseBundleRoute(req.params.bundleRoute);

    bundle.registry = registry;
    bundle.id = req.params.account + '/' + req.params.bundleRoute;
    bundleCache.get(bundle, function(err, content) {
      if (err || !content) {
        return reply(Boom.notFound(err));
      }
      reply(content)
        .type(extContentType[bundle.extension])
        .header('cache-control', 'max-age=' +
          server.plugins['file-max-age'].getByExtension(bundle.extension));
    });
  }

  server.route({
    method: 'GET',
    path: '/bundle/{bundleRoute*}',
    handler: bundleHandler
  });

  server.route({
    method: 'GET',
    path: '/{account}/bundle/{bundleRoute*}',
    handler: bundleHandler
  });

  next();
};

exports.register.attributes = {
  name: 'app/bundle',
  dependencies: ['bundle-service', 'reference-service', 'file-max-age']
};
