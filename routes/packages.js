'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');

module.exports = function(destPath) {
  return function(req, res) {
    var packages = parsePackageURL(req.url.substr(1));
    var bundle = readPackages(destPath, packages);
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write(bundle);
    res.end();
  };
};
