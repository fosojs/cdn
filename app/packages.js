'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');
var extContentType = require('../utils/ext-content-type');
var parseExt = require('../utils/parse-ext');

exports.register = function(server, opts, next) {
  server.route({
    method: 'GET',
    path: '/packages/{packagesURL*}',
    handler: function(req, reply) {
      var bundleName = parseExt(req.params.packagesURL);
      var packages = parsePackageURL(bundleName.path, bundleName.ext);
      var bundle = readPackages(opts.storagePath, packages);
      return reply(bundle).type(extContentType[bundleName.ext]);
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/packages'
};
