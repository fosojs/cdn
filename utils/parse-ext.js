'use strict';

function parseExt(url) {
  var parts = url.split('.');
  var ext = parts.pop();
  return {
    path: parts.join('.'),
    ext: ext
  };
}

module.exports = parseExt;
