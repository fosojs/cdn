'use strict';

var parsePackageURL = require('../../utils/parse-package-url');
var parseExt = require('../../utils/parse-ext');

exports.register = function(server, opts, next) {
  var extContentType = {
    js: 'text/javascript',
    css: 'text/css'
  };

  server.route({
    method: 'GET',
    path: '/bundle/{packagesURL*}',
    handler: function(req, reply) {
      var bundleName = parseExt(req.params.packagesURL);
      var paths = parsePackageURL(bundleName.path, bundleName.ext);

      var packages = [];
      paths.forEach(function(path) {
        if (typeof path === 'object') {
          packages.push(path);
          return;
        }
        var referenceName = path + '.' + bundleName.ext;
        var referencePackages = server.plugins['reference-service'].get(referenceName);
        packages = packages.concat(referencePackages);
      });
      packages.forEach(function(pkg) {
        if (!pkg.files || !pkg.files.length) {
          pkg.files = ['index.' + bundleName.ext];
        }
      });

      var bundle = server.plugins['bundle-service'].get(packages);
      return reply(bundle).type(extContentType[bundleName.ext]);
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/bundle',
  dependencies: ['bundle-service', 'reference-service']
};
