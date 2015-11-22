'use strict';

var parseExt = require('./parse-ext');
var parsePackageRoute = require('./parse-package-route');
var R = require('ramda');

function parsePath(url, extension) {
  if (!url) {
    throw new Error('url is required');
  }
  if (!extension) {
    throw new Error('extension is required');
  }

  var packageRoutes = url.split(',');
  var packages = R.map(R.partialRight(parsePackageRoute, [extension]),
    packageRoutes);

  return packages;
}

function parseBundleRoute(route) {
  var parts = parseExt(route);
  return {
    paths: parsePath(parts.path, parts.ext),
    extension: parts.ext
  };
}

module.exports = parseBundleRoute;
