'use strict';

var fmt = require('util').format;
const request = require('request');
const tar = require('tar-fs');
const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const normalize = require('normalize-path');

function Package(name, version, opts) {
  this.name = name;
  this.version = version;
  this.opts = opts || {};
}

Package.prototype = {
  get directory() {
    return normalize(path.resolve(config.storagePath, this.name, this.version));
  },
  get tarballURL() {
    return fmt('%s%s/-/%s-%s.tgz', config.registry, this.name, this.name,
      this.version);
  },
  get isCached() {
    return fs.existsSync(this.directory);
  },
  get json() {
    return require(path.resolve(this.directory, 'package', 'package.json'));
  }
};

Package.prototype.log = function(msg) {
  var _this = this;

  if (_this.opts.verbose) {
    console.log(msg);
  }
};

Package.prototype.download = function(callback) {
  var _this = this;
  if (_this.isCached) {
    return callback(null);
  }

  _this.log('downloading tarball: ' + this.tarballURL);

  request(this.tarballURL)
    .pipe(require('zlib').createGunzip())
    .pipe(tar.extract(this.directory))
    .on('finish', function() {
      _this.log('tarball downloaded: ' + this.tarballURL);
      _this.buildFileTree(callback);
    })
    .on('error', callback);
};

Package.prototype.buildFileTree = function(callback) {
  var _this = this;
  var finder = require('findit')(_this.directory);
  _this.files = [];

  _this.log('building file tree');

  finder.on('file', function(file, stat) {
    _this.files.push(normalize(file)
      .replace(_this.directory + '/package/', ''));
  });

  finder.on('end', function() {
    _this.log('built file tree', _this.files);
    _this.writeIndexFiles(callback);
  });
};

Package.prototype.writeIndexFiles = function(callback) {
  var _this = this;
  var indexTemplate = require('handlebars').compile(
    fs.readFileSync(path.resolve(__dirname, './index.template.hbs'), 'utf-8')
  );

  _this.log('writing _index.json');

  fs.writeFileSync(
    path.resolve(_this.directory, 'package', '_index.json'),
    JSON.stringify(_this.files, null, 2)
  );

  _this.log('writing _index.html');

  fs.writeFileSync(
    path.resolve(_this.directory, 'package', '_index.html'),
    indexTemplate(_this)
  );

  _this.log('wrote index files');

  callback(null);
};

Package.prototype.streamFile = function(filename) {
  return new Promise(function(resolve, reject) {
    var self = this;

    var file = path.resolve(this.directory, 'package', filename);

    this.download(function(err) {
      if (err) {
        return reject(err);
      }

      if (!fs.existsSync(file)) {
        return reject(new Error('File not found: ' + file));
      }

      if (filename === 'package.json') {
        return resolve(fs.createReadStream(file));
      }

      if (self.json.icon && self.json.icon === filename) {
        return resolve(fs.createReadStream(file));
      }

      if (process.env.RESTRICTED_ACCESS) {
        return reject(new Error('I only serve package.json files and package icons these days.'));
      }
      return resolve(fs.createReadStream(file));
    });
  }.bind(this));
};

Package.prototype.readFile = function(filename) {
  return new Promise(function(resolve, reject) {
    this.streamFile(filename)
      .then(function(stream) {
        stream.setEncoding('utf8');
        var file = '';
        stream.on('data', (chunk) => file += chunk);
        stream.on('end', () => resolve(file));
      })
      .catch(reject);
  }.bind(this));
};

module.exports = Package;
