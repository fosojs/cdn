'use strict';

var parsePackageURL = require('../../utils/parse-package-url');
var readPackages = require('./read-packages');
var yamlOrJSON = require('yaml-or-json');
var path = require('path');
var extContentType = require('./ext-content-type');
var parseExt = require('../../utils/parse-ext');

exports.register = function(server, opts, next) {
  server.route({
    method: 'GET',
    path: '/bundle/{packagesURL*}',
    handler: function(req, reply) {
      var bundleName = parseExt(req.params.packagesURL);
      var refs = parsePackageURL(bundleName.path, bundleName.ext);

      var namedBundles = yamlOrJSON(path.join(opts.storagePath, './bundles'));
      var packages = [];
      refs.forEach(function(ref) {
        if (typeof ref === 'object') {
          packages.push(ref);
          return;
        }
        packages = packages.concat(namedBundles[ref + '.' + bundleName.ext]);
      });
      packages.forEach(function(pkg) {
        if (!pkg.files || !pkg.files.length) {
          pkg.files = ['index.' + bundleName.ext];
        }
      });

      var bundle = readPackages(opts.storagePath, packages);
      return reply(bundle).type(extContentType[bundleName.ext]);
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/bundle'
};
