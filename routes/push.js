'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');
var yamlOrJSON = require('yaml-or-json');
var path = require('path');
var yaml = require('write-yaml');
var parseExt = require('../utils/parse-ext');

module.exports = function(destPath) {
  return function(req, res) {
    var data = req.body;
    data.deletePackages = data.deletePackages || [];

    var bundle = parseExt(data.bundle);
    var pathToBnr = path.join(destPath, './bundles');
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

    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('Successfully pushed');
    res.end();
  };
};
