'use strict'
const Boom = require('boom')
const parseExt = require('../../utils/parse-ext')

module.exports = function(server, opts, next) {
  let registry = server.plugins.registry

  function rawHandler(req, reply) {
    let metaParts = req.params.pkgMeta.split('@')
    let pkg = {
      name: metaParts[0],
      version: metaParts[1] || 'latest',
      file: req.params.path || '_index.html',
    }

    server.plugins['bundle-service'].getRaw(pkg, {
      registry: req.pre.registry,
    }, function(err, result) {
      if (err) {
        return reply(Boom.notFound(err))
      }
      reply(result.stream)
        .type(server.mime.path(req.params.path).type)
        .header('cache-control', 'max-age=' + result.maxAge)
        .header('Access-Control-Allow-Origin', '*')
    })
  }

  server.route({
    method: 'GET',
    path: '/raw/{pkgMeta}/{path*}',
    config: {
      pre: [registry.pre],
    },
    handler: rawHandler,
  })

  server.route({
    method: 'GET',
    path: '/{account}/raw/{pkgMeta}/{path*}',
    config: {
      pre: [registry.pre],
    },
    handler: rawHandler,
  })

  next()
}

module.exports.attributes = {
  name: 'web/raw',
  dependencies: ['bundle-service', 'file-max-age', 'registry'],
}
