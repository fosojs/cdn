'use strict';

const RegClient = require('npm-registry-client');
const fmt = require('util').format;
const tar = require('tar-fs');
const zlib = require('zlib');
const findit = require('findit');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const normalize = require('normalize-path');
const chalk = require('chalk');
const debug = require('debug')('cdn');
const streamToString = require('./stream-to-string');

let regClient = new RegClient();

function Package(name, version, opts) {
  this.name = name;
  this.version = version;
  this.opts = opts || {};

  if (!opts.registry) {
    throw new Error('opts.registry is required');
  }
  this._registry = opts.registry;
}

Package.prototype = {
  get directory() {
    let packageFolder = this.name.replace('/', '--');
    return normalize(
      path.resolve(config.get('storagePath'), packageFolder, this.version)
    );
  },
  get tarballURL() {
    let justPkgName;
    if (this.name[0] !== '@') {
      justPkgName = this.name;
    } else {
      justPkgName = this.name.split('/')[1];
    }
    return fmt('%s%s/-/%s-%s.tgz', this._registry.url, this.name, justPkgName,
      this.version);
  },
  get isCached() {
    return fs.existsSync(this.directory);
  },
  get json() {
    return require(path.resolve(this.directory, 'package', 'package.json'));
  }
};

Package.prototype.download = function(callback) {
  if (this.isCached) return callback(null);

  debug('downloading tarball: ' + chalk.magenta(this.tarballURL));

  regClient.fetch(this.tarballURL, {
    auth: {
      token: this._registry.token,
    },
  }, function(err, res) {
    if (err) return callback(err);

    res
      .pipe(zlib.createGunzip())
      .on('error', callback)
      .pipe(tar.extract(this.directory))
      .on('finish', function() {
        debug('tarball downloaded: ' + chalk.magenta(this.tarballURL));
        this.buildFileTree(callback);
      }.bind(this))
      .on('error', callback);
  }.bind(this));
};

Package.prototype.buildFileTree = function(callback) {
  let finder = findit(this.directory);
  this.files = [];

  debug('building file tree');

  finder.on('file', function(file, stat) {
    this.files.push(normalize(file)
      .replace(this.directory + '/package/', ''));
  }.bind(this));

  finder.on('end', function() {
    debug('built file tree');
    this.writeIndexFiles(callback);
  }.bind(this));
};

Package.prototype.writeIndexFiles = function(callback) {
  let indexTemplate = handlebars.compile(
    fs.readFileSync(path.resolve(__dirname, './index.template.hbs'), 'utf-8')
  );

  debug('writing _index.json');

  fs.writeFileSync(
    path.resolve(this.directory, 'package', '_index.json'),
    JSON.stringify(this.files, null, 2)
  );

  debug('writing _index.html');

  fs.writeFileSync(
    path.resolve(this.directory, 'package', '_index.html'),
    indexTemplate(this)
  );

  debug('wrote index files');

  callback(null);
};

Package.prototype.streamFile = function(filename) {
  return new Promise(function(resolve, reject) {
    let file = path.resolve(this.directory, 'package', filename);

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

      if (this.json.icon && this.json.icon === filename) {
        return resolve(fs.createReadStream(file));
      }

      if (process.env.RESTRICTED_ACCESS) {
        return reject(new Error('I only serve package.json files and package icons these days.'));
      }
      return resolve(fs.createReadStream(file));
    }.bind(this));
  }.bind(this));
};

Package.prototype.readFile = function(filename) {
  return this.streamFile(filename).then(streamToString);
};

module.exports = Package;
