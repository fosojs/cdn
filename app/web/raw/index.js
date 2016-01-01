'use strict';

const Boom = require('boom');
const config = require('../../../config');
const parseExt = require('../../utils/parse-ext');

module.exports = function(server, opts, next) {
  let extContentType = opts.extensionContentType || {};

  function getRegistry(account) {
    if (!account) {
      return config.get('registry');
    }
    if (config.get('accounts') && config.get('accounts')[account]) {
      return config.get('accounts')[account].registry;
    }
    return null;
  }

  function rawHandler(req, reply) {
    let registry = getRegistry(req.params.account);
    if (!registry) {
      return reply(Boom.notFound('Passed account not found'));
    }

    let metaParts = req.params.pkgMeta.split('@');
    let pkg = {
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
        .type(extContentType[parseExt(pkg.file).ext])
        .header('cache-control', 'max-age=' + result.maxAge)
        .header('Access-Control-Allow-Origin', '*');
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
