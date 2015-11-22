'use strict';

var path = require('path');
var yamlOrJSON = require('yaml-or-json');
var yaml = require('write-yaml');

exports.register = function(plugin, opts, next) {
  var pathToBnr = path.join(opts.storagePath, './bundles');

  plugin.expose('get', function(name) {
    var bnr = yamlOrJSON(pathToBnr);
    var packages = bnr[name];
    return packages;
  });

  plugin.expose('set', function(name, packages) {
    var bnr = yamlOrJSON(pathToBnr);
    bnr[name] = packages;
    yaml.sync(pathToBnr + '.yml', bnr);
  });

  next();
};

exports.register.attributes = {
  name: 'reference-service'
};
