'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');
var parseExt = require('../utils/parse-ext');

var contentTypes = {
  js: 'text/javascript',
  css: 'text/css'
};

module.exports = function(destPath) {
  return function(req, res) {
    var url = req.url.substr(1);
    var packagesURL = parseExt(url);
    var packages = parsePackageURL(packagesURL.path, packagesURL.ext);
    var bundle = readPackages(destPath, packages);
    res.writeHead(200, {'content-type': contentTypes[packagesURL.ext]});
    res.write(bundle);
    res.end();
  };
};
