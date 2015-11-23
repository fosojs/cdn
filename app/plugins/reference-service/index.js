'use strict';

var path = require('path');
var yamlOrJSON = require('yaml-or-json');
var yaml = require('write-yaml');

exports.register = function(plugin, opts, next) {
  var pathToRefs = path.join(opts.storagePath, './references');

  plugin.expose('get', function(name) {
    var refs = yamlOrJSON(pathToRefs);
    var packages = refs[name];
    return packages;
  });

  plugin.expose('set', function(name, packages) {
    var refs = yamlOrJSON(pathToRefs);
    if (packages.length) {
      refs[name] = packages;
    } else {
      delete refs[name];
    }
    yaml.sync(pathToRefs + '.yml', refs);
  });

  next();
};

exports.register.attributes = {
  name: 'reference-service'
};
