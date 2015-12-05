'use strict';

var parseBundleRoute = require('../../utils/parse-bundle-route');
var parseExt = require('../../utils/parse-ext');

exports.register = function(server, opts, next) {
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

  server.route({
    method: 'GET',
    path: '/bundle/{bundleRoute*}',
    handler: function(req, reply) {
      var bundle = parseBundleRoute(req.params.bundleRoute);

      var packages = bundleToPkgs(bundle);

      server.plugins['bundle-service'].get(packages, function(err, content) {
        if (err) {
          /* reply with error */
          throw err;
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
