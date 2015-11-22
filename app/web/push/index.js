'use strict';

var parseBundleRoute = require('../../utils/parse-bundle-route');
var parseExt = require('../../utils/parse-ext');

exports.register = function(server, opts, next) {
  server.route({
    method: 'POST',
    path: '/push',
    handler: function(req, reply) {
      var data = req.payload;
      data.deletePackages = data.deletePackages || [];

      var bundle = parseExt(data.bundle);
      var packages = server.plugins['reference-service'].get(data.bundle);

      var pkgDict = {};
      packages.forEach(function(pkg) {
        if (data.deletePackages.indexOf(pkg.name) === -1) {
          pkgDict[pkg.name] = pkg;
        }
      });

      if (data.packages.length) {
        var newPackages = parseBundleRoute(data.packages.join(',') + '.' + bundle.ext);
        newPackages.paths.forEach(function(pkg) {
          pkgDict[pkg.name] = pkg;
        });
      }

      var newParts = [];
      for (var pkgName in pkgDict) {
        newParts.push(pkgDict[pkgName]);
      }

      server.plugins['reference-service'].set(data.bundle, newParts);

      return reply({
        message: 'Successfully pushed'
      });
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/push',
  dependencies: ['reference-service']
};
