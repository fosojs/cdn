'use strict'
module.exports = parsePackageRoute

const R = require('ramda')

function parseNameVersion (nv) {
  let prefix
  if (nv[0] === '@') {
    prefix = '@'
    nv = nv.slice(1)
  } else {
    prefix = ''
  }
  const parts = nv.split('@')
  return {
    name: prefix + parts[0],
    version: parts[1] || '*',
  }
}

function parsePackageRoute (packageRoute, extension) {
  const end = '.' + extension

  /*
  if (packageRoute.startsWith('@')) {
    return packageRoute.substr(1)
  }*/
  if (packageRoute.indexOf('(') !== -1) {
    const parts = packageRoute.split('(')
    const filesPart = parts[1].substr(0, parts[1].length - 1)
    return R.merge(parseNameVersion(parts[0]), {
      files: filesPart.split('+').map(function (filePath) {
        return filePath.endsWith(end) ? filePath : filePath + end
      }),
    })
  }
  return parseNameVersion(packageRoute)
}
