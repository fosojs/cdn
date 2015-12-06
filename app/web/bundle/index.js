'use strict';

var parseBundleRoute = require('../../utils/parse-bundle-route');
var parseExt = require('../../utils/parse-ext');
var Boom = require('boom');

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
    packages.forEach(function(pkg) {
      if (!pkg.files || !pkg.files.length) {
        pkg.files = ['index.' + bundle.extension];
      }
    });
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

      server.plugins['bundle-service'].get(packages, function(err, pkgFiles) {
        if (err) {
          return next(null, null);
        }
        var content = bundleFiles(id.extension, pkgFiles);
        next(null, content);
      });
    },
    generateTimeout: 1000 * 10 /* 10 seconds */
  });

  server.route({
    method: 'GET',
    path: '/bundle/{bundleRoute*}',
    handler: function(req, reply) {
      var bundle = parseBundleRoute(req.params.bundleRoute);

      bundle.id = req.params.bundleRoute;
      bundleCache.get(bundle, function(err, content) {
        if (err || !content) {
          return reply(Boom.notFound(err));
        }
        reply(content).type(extContentType[bundle.extension]);
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/bundle',
  dependencies: ['bundle-service', 'reference-service']
};
