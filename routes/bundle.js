'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');
var yamlOrJSON = require('yaml-or-json');
var path = require('path');

module.exports = function(destPath) {
  return function(req, res) {
    var bundleName = req.url.substr(1);
    var bnr = yamlOrJSON(path.join(destPath, './bnr'));

    var packages = parsePackageURL(bnr[bundleName]);
    var bundle = readPackages(destPath, packages);

    res.writeHead(200, {'content-type': 'text/plain'});
    res.write(bundle);
    res.end();
  };
};
