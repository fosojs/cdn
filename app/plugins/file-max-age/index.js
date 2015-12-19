'use strict';

const parseExtension = require('../../utils/parse-ext');
const Duration = require('duration-js');

module.exports = function(plugin, opts, next) {
  if (!opts.maxAge) {
    throw new Error('opts.maxAge is required');
  }

  function getByExtension(extension) {
    var maxAgeTimeSpan = opts.maxAge[extension] || opts.maxAge['default'];
    return timeSpanToSec(maxAgeTimeSpan);
  }

  function timeSpanToSec(timeSpan) {
    if (!isNaN(Number(timeSpan))) {
      return timeSpan;
    }
    var d = new Duration(timeSpan);
    return d.seconds();
  }

  plugin.expose('getByExtension', getByExtension);
  plugin.expose('getByPath', function(path) {
    return getByExtension(parseExtension(path).ext);
  });

  next();
};

module.exports.attributes = {
  name: 'file-max-age'
};
