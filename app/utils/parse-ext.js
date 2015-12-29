'use strict';

function parseExt(url) {
  let parts = url.split('.');
  let ext = parts.pop();
  return {
    path: parts.join('.'),
    ext: ext
  };
}

module.exports = parseExt;
