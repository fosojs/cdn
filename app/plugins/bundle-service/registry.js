'use strict';

const RegClient = require('npm-registry-client');
const semver = require('semver');

let regClient = new RegClient();

//
// Find tarballs on npm
//
function Registry(opts) {
  opts = opts || {};

  if (!opts.registry) {
    throw new Error('opts.registry is required');
  }
  this._registry = opts.registry;
}

Registry.prototype.resolve = function(module, version) {
  return new Promise(function(resolve, reject) {
    this._versions(module, version, function(err, v) {
      if (err) return reject(err);
      resolve(v);
    });
  }.bind(this));
};

Registry.prototype._getMatchedVersions = function(version, data) {
  try {
    if (version === 'latest') {
      return [data['dist-tags'].latest];
    }

    if (!semver.validRange(version)) {
      console.log('not a valid range ' + version);

      return Object.keys(data.versions).filter(v => v === version);
    }

    return Object.keys(data.versions)
      .filter(v => semver.satisfies(v, version))
      .sort((a, b) => semver.lte(a, b));
  } catch (e) {
    return null;
  }
};

Registry.prototype._versions = function(module, version, cb) {
  regClient.get(this._registry.url + module.replace('/', '%2f'), {
    auth: {
      token: this._registry.token,
    },
  }, function(err, data) {
    if (err) return cb(err);

    let v = this._getMatchedVersions(version, data);

    if (!v || !v.length) {
      let e = new Error('No match for semver `' + version + '` found');
      e.versions = Object.keys(data.versions);
      return cb(e);
    }

    cb(null, data.versions[v[0]]);
  }.bind(this));
};

module.exports = Registry;
