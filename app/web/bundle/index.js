'use strict';

var parseBundleRoute = require('../../utils/parse-bundle-route');
var parseExt = require('../../utils/parse-ext');

exports.register = function(server, opts, next) {
  var refService = server.plugins['reference-service'];

  var extContentType = {
    js: 'text/javascript',
    css: 'text/css'
  };

  server.route({
    method: 'GET',
    path: '/bundle/{bundleRoute*}',
    handler: function(req, reply) {
      var bundle = parseBundleRoute(req.params.bundleRoute);

      var packages = [];
      bundle.paths.forEach(function(path) {
        if (typeof path === 'object') {
          packages.push(path);
          return;
        }
        var referenceName = path + '.' + bundle.extension;
        var referencePackages = refService.get(referenceName);
        packages = packages.concat(referencePackages);
      });
      packages.forEach(function(pkg) {
        if (!pkg.files || !pkg.files.length) {
          pkg.files = ['index.' + bundle.extension];
        }
      });

      bundle.content = server.plugins['bundle-service'].get(packages);
      reply(bundle.content).type(extContentType[bundle.extension]);
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/bundle',
  dependencies: ['bundle-service', 'reference-service']
};
