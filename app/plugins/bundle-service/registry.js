'use strict'
module.exports = registry

const RegClient = require('npm-registry-client')
const semver = require('semver')

const regClient = new RegClient()

//
// Find tarballs on npm
//
function registry (opts) {
  opts = opts || {}

  if (!opts.url) {
    throw new Error('opts.url is required')
  }

  return { resolve }

  function resolve (opts) {
    opts = opts || {}

    if (!opts.name) {
      throw new Error('opts.name is required')
    }

    return new Promise((resolve, reject) => {
      versions(opts.name, opts.version, (err, v) => {
        if (err) return reject(err)
        resolve(v)
      })
    })
  }

  function getMatchedVersions (version, data) {
    try {
      if (version === 'latest') {
        return [data['dist-tags'].latest]
      }

      if (!semver.validRange(version)) {
        console.log('not a valid range ' + version)

        return Object.keys(data.versions).filter(v => v === version)
      }

      return Object.keys(data.versions)
        .filter(v => semver.satisfies(v, version))
        .sort((a, b) => semver.lte(a, b))
    } catch (e) {
      return null
    }
  }

  function versions (module, version, cb) {
    const encodedPackageName = encodePackageName(module)
    regClient.get(opts.url + encodedPackageName, {
      auth: {
        token: opts.token,
      },
    }, (err, data) => {
      if (err) return cb(err)

      const v = getMatchedVersions(version, data)

      if (!v || !v.length) {
        const e = new Error('No match for semver `' + version + '` found')
        e.versions = Object.keys(data.versions)
        return cb(e)
      }

      cb(null, data.versions[v[0]])
    })
  }

  function encodePackageName (packageName) {
    if (packageName.charAt(0) === '@') {
      return `@${encodeURIComponent(packageName.substring(1))}`
    }
    return encodeURIComponent(packageName)
  }
}
