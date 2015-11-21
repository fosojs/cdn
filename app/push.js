'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');
var yamlOrJSON = require('yaml-or-json');
var path = require('path');
var yaml = require('write-yaml');
var parseExt = require('../utils/parse-ext');

exports.register = function(server, opts, next) {
  server.route({
    method: 'POST',
    path: '/push',
    handler: function(req, reply) {
      var data = req.payload;
      data.deletePackages = data.deletePackages || [];

      var bundle = parseExt(data.bundle);
      var pathToBnr = path.join(opts.storagePath, './bundles');
      var bnr = yamlOrJSON(pathToBnr);
      var packages = parsePackageURL(bnr[data.bundle], bundle.ext);

      var pkgDict = {};
      packages.forEach(function(pkg) {
        if (data.deletePackages.indexOf(pkg.name) === -1) {
          pkgDict[pkg.name] = pkg.version;
        }
      });

      if (data.packages.length) {
        var newPackages = parsePackageURL(data.packages.join(','), bundle.ext);
        newPackages.forEach(function(pkg) {
          pkgDict[pkg.name] = pkg.version;
        });
      }

      var newParts = [];
      for (var pkgName in pkgDict) {
        newParts.push(pkgName + '@' + pkgDict[pkgName]);
      }

      bnr[data.bundle] = newParts.join(',');

      yaml.sync(pathToBnr + '.yml', bnr);

      return reply('Successfully pushed').type('text/plain');
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/push'
};
