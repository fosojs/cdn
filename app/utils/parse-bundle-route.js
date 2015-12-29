'use strict';

const parseExt = require('./parse-ext');
const parsePackageRoute = require('./parse-package-route');
const R = require('ramda');

function parsePath(url, extension) {
  if (!url) {
    throw new Error('url is required');
  }
  if (!extension) {
    throw new Error('extension is required');
  }

  let packageRoutes = url.split(',');
  let packages = R.map(R.partialRight(parsePackageRoute, [extension]),
    packageRoutes);

  return packages;
}

function parseBundleRoute(route) {
  let parts = parseExt(route);
  let prefix = route.match(/(\.min)?\.(js|css)$/)[0];
  let opts = prefix.split('.');

  return {
    paths: parsePath(parts.path.replace(/\.min$/, ''), parts.ext),
    extension: parts.ext,
    options: opts.slice(1, opts.length - 1)
  };
}

module.exports = parseBundleRoute;
