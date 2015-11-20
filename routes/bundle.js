'use strict';

var parsePackageURL = require('../utils/parse-package-url');
var readPackages = require('../utils/read-packages');
var yamlOrJSON = require('yaml-or-json');
var path = require('path');
var parseExt = require('../utils/parse-ext');
var extContentType = require('../utils/ext-content-type');

module.exports = function(destPath) {
  return function(req, res) {
    var url = req.url.substr(1);
    var bundleURL = parseExt(url);
    var bundles = yamlOrJSON(path.join(destPath, './bundles.' + bundleURL.ext));

    var packages = parsePackageURL(bundles[bundleURL.path], bundleURL.ext);
    var bundle = readPackages(destPath, packages);

    res.writeHead(200, {'content-type': extContentType[bundleURL.ext]});
    res.write(bundle);
    res.end();
  };
};
