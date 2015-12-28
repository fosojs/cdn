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

Registry.prototype._versions = function(module, version, cb) {
  regClient.get(this._registry.url + module.replace('/', '%2f'), {
    auth: {
      token: this._registry.token,
    },
  }, function(err, data) {
    if (err) return cb(err);

    let v;

    try {
      if (version === 'latest') {
        v = [data['dist-tags'].latest];
      } else if (!semver.validRange(version)) {
        console.log('not a valid range ' + version);

        v = Object.keys(data.versions).filter(v => v === version);
      } else {
        v = Object.keys(data.versions)
          .filter(v => semver.satisfies(v, version))
          .sort((a, b) => semver.lte(a, b));
      }
    } catch (e) {
      v = null;
    }

    if (!v || !v.length) {
      let e = new Error('No match for semver `' + version + '` found');
      e.versions = Object.keys(data.versions);
      return cb(e);
    }

    cb(null, data.versions[v[0]]);
  });
};

module.exports = Registry;
