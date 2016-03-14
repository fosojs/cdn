'use strict'
const mime = require('mime')

module.exports = function (server, opts) {
  if (!opts.bundleService) {
    return new Error('opts.bundleService is required')
  }

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

      opts.bundleService.getRaw(pkg, {
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
      .catch(err => res
        .status(404)
        .set('Content-Type', 'text/plain')
        .send(`Not found: file "${pkg.file}" in package ${pkg.name}@${pkg.version}`))
    },
  })
}

module.exports.attributes = {
  name: 'web/raw',
  dependencies: ['registry'],
}
