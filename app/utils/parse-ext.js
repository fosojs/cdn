'use strict'
module.exports = parseExt

function parseExt (url) {
  const parts = url.split('.')
  const ext = parts.pop()
  return {
    path: parts.join('.'),
    ext: ext,
  }
}
