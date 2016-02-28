'use strict'
module.exports = Registry

const RegClient = require('npm-registry-client')
const semver = require('semver')

const regClient = new RegClient()

//
// Find tarballs on npm
//
function Registry (opts) {
  opts = opts || {}

  if (!opts.registry) {
    throw new Error('opts.registry is required')
  }
  this._registry = opts.registry
}

Registry.prototype.resolve = function (module, version) {
  return new Promise((resolve, reject) => {
    this._versions(module, version, function (err, v) {
      if (err) return reject(err)
      resolve(v)
    })
  })
}

Registry.prototype._getMatchedVersions = function (version, data) {
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

Registry.prototype._versions = function (module, version, cb) {
  regClient.get(this._registry.url + module.replace('/', '%2f'), {
    auth: {
      token: this._registry.token,
    },
  }, (err, data) => {
    if (err) return cb(err)

    const v = this._getMatchedVersions(version, data)

    if (!v || !v.length) {
      const e = new Error('No match for semver `' + version + '` found')
      e.versions = Object.keys(data.versions)
      return cb(e)
    }

    cb(null, data.versions[v[0]])
  })
}
