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
    path: '/bundle/{name}.{extension}',
    handler: function(req, reply) {
      var bundles = yamlOrJSON(path.join(opts.storagePath, './bundles'));

      var bundleName = req.params.name + '.' + req.params.extension;
      var packages = parsePackageURL(bundles[bundleName], req.params.extension);
      var bundle = readPackages(opts.storagePath, packages);

      return reply(bundle).type(extContentType[req.params.extension]);
    }
  });

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
  name: 'app/bundle'
};
