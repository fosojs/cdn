'use strict'
const Boom = require('boom')
const mime = require('mime')

module.exports = function (server, opts) {
  server.route({
    method: 'GET',
    path: '/:account?/raw/:pkgMeta/*',
    config: {
      registry: true,
    },
    handler (req, res) {
      const metaParts = req.params.pkgMeta.split('@')
      const pkg = {
        name: metaParts[0],
        version: metaParts[1] || 'latest',
        file: req.params[0] || '_index.html',
      }

      server.plugins.bundleService.getRaw(pkg, {
        registry: req.registry,
      })
      .then((result) => {
        res
          .set('Content-Type', mime.lookup(req.params[0]))
          .set('Cache-Control', 'max-age=' + result.maxAge)
          .set('Access-Control-Allow-Origin', '*')

        result.stream.on('data', data => res.write(data))
        result.stream.on('end', () => res.end())
        result.stream.on('error', err => console.error(err))
      })
      .catch(err => res.send(Boom.notFound(err)))
    },
  })
}

module.exports.attributes = {
  name: 'web/raw',
  dependencies: ['bundle-service', 'file-max-age', 'registry'],
}
