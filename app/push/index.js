'use strict';

var parsePackageURL = require('../../utils/parse-package-url');
var yamlOrJSON = require('yaml-or-json');
var path = require('path');
var yaml = require('write-yaml');
var parseExt = require('../../utils/parse-ext');

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
      var packages = bnr[data.bundle];

      var pkgDict = {};
      packages.forEach(function(pkg) {
        if (data.deletePackages.indexOf(pkg.name) === -1) {
          pkgDict[pkg.name] = pkg;
        }
      });

      if (data.packages.length) {
        var newPackages = parsePackageURL(data.packages.join(','), bundle.ext);
        newPackages.forEach(function(pkg) {
          pkgDict[pkg.name] = pkg;
        });
      }

      var newParts = [];
      for (var pkgName in pkgDict) {
        newParts.push(pkgDict[pkgName]);
      }

      bnr[data.bundle] = newParts;

      yaml.sync(pathToBnr + '.yml', bnr);

      return reply('Successfully pushed').type('text/plain');
    }
  });

  next();
};

exports.register.attributes = {
  name: 'app/push'
};
