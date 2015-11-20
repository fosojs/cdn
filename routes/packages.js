'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');
var parseExt = require('../utils/parse-ext');
var extContentType = require('../utils/ext-content-type');

module.exports = function(destPath) {
  return function(req, res) {
    var url = req.url.substr(1);
    var packagesURL = parseExt(url);
    var packages = parsePackageURL(packagesURL.path, packagesURL.ext);
    var bundle = readPackages(destPath, packages);
    res.writeHead(200, {'content-type': extContentType[packagesURL.ext]});
    res.write(bundle);
    res.end();
  };
};
