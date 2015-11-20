'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');
var yamlOrJSON = require('yaml-or-json');
var path = require('path');
var yaml = require('write-yaml');

module.exports = function(destPath) {
  return function(req, res) {
    var data = req.body;
    var pathToBnr = path.join(destPath, './bnr');
    var bnr = yamlOrJSON(pathToBnr);
    var packages = parsePackageURL(bnr[data.bundle]);

    var pkgDict = {};
    packages.forEach(function(pkg) {
      pkgDict[pkg.name] = pkg.version;
    });

    var newPackages = parsePackageURL(data.packages.join(','));
    newPackages.forEach(function(pkg) {
      pkgDict[pkg.name] = pkg.version;
    });

    var newParts = [];
    for (var pkgName in pkgDict) {
      newParts.push(pkgName + '@' + pkgDict[pkgName]);
    }

    bnr[data.bundle] = newParts.join(',');

    yaml.sync(pathToBnr + '.yaml', bnr);

    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('Successfully pushed');
    res.end();
  };
};
