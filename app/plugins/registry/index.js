'use strict';

const mongoose = require('mongoose');

exports.register = function(plugin, opts, next) {
  let connection = mongoose.createConnection(opts.mongoURI);

  let Registry = require('./registry-model')(connection);

  plugin.expose('getByName', function(name, cb) {
    Registry.findOne({
      name
    }, cb);
  });

  next();
};

exports.register.attributes = {
  name: 'registry',
};
