'use strict';

const request = require('request');
const semver = require('semver');

//
// Find tarballs on npm
//
function Registry(opts) {
  opts = opts || {};

  if (!opts.registry) {
    throw new Error('opts.registry is required');
  }
  this._registry = opts.registry.url;

  this._headers = {};
  if (opts.registry.token) {
    this._headers.authorization = 'Bearer ' + opts.registry.token;
  }
}

Registry.prototype._metadata = function(module, cb) {
  request({
    uri: this._registry + module,
    json: true,
    headers: this._headers
  }, function(err, res, body) {
    if (res.statusCode !== 200) {
      if (body.error === 'not_found') {
        err = new Error('module `' + module + '` is not on npm.');
      } else {
        err = new Error('npm registry returned status code ' + res.statusCode);
      }
    }

    if (err) {
      err.body = body;
    }

    cb(err, body);
  });
};

Registry.prototype.resolve = function(module, version) {
  return new Promise(function(resolve, reject) {
    this._versions(module, version, function(err, v) {
      if (err) return reject(err);
      resolve(v);
    });
  }.bind(this));
};

Registry.prototype._versions = function(module, version, cb) {
  this._metadata(module, function(err, data) {
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
