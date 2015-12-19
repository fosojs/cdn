'use strict';

var Boom = require('boom');
var config = require('../../../config');

module.exports = function(server, opts, next) {
  function rawHandler(req, reply) {
    let registry;
    if (req.params.account) {
      if (config.accounts && config.accounts[req.params.account]) {
        registry = config.accounts[req.params.account].registry;
      } else {
        return reply(Boom.notFound('Passed account not found'));
      }
    } else {
      registry = config.registry;
    }

    var metaParts = req.params.pkgMeta.split('@');
    var pkg = {
      name: metaParts[0],
      version: metaParts[1] || 'latest',
      file: req.params.path || '_index.html'
    };

    server.plugins['bundle-service'].getRaw(pkg, {
      registry: registry
    }, function(err, result) {
      if (err) {
        return reply(Boom.notFound(err));
      }
      reply(result.stream)
        .header('cache-control', 'max-age=' + result.maxAge);
    });
  }

  server.route({
    method: 'GET',
    path: '/raw/{pkgMeta}/{path*}',
    handler: rawHandler
  });

  server.route({
    method: 'GET',
    path: '/{account}/raw/{pkgMeta}/{path*}',
    handler: rawHandler
  });

  next();
};

module.exports.attributes = {
  name: 'web/raw',
  dependencies: ['bundle-service', 'file-max-age']
};
