'use strict'
const Boom = require('boom')
const plugiator = require('plugiator')

function register (plugin, opts) {
  if (!opts.defaultRegistry)
    return new Error('opts.defaultRegistry is required')
  if (!opts.defaultRegistry.url)
    return new Error('opts.defaultRegistry.url is required')

  const registryCache = plugin.cache({
    expiresIn: opts.internalCacheExpiresIn,
    generateTimeout: 1000 * 20,
    segment: 'registrySegment',
    generateFunc (id, next) {
      if (!id) return next(null, opts.defaultRegistry)

      const registryStore = plugin.plugins.registryStore
      if (!registryStore)
        return next(new Error('registry-store not registered'))

      if (typeof registryStore.getByName !== 'function')
        return next(new Error('registry-store doesn\' have a getByName function'))

      return registryStore.getByName(id, next)
    },
  })

  const registryMiddleware = (req, res, next) => {
    registryCache.get(req.params.account, function (err, registry) {
      if (err) {
        return res.send(Boom.notFound('registry not found', err))
      }

      req.registry = registry
      next()
    })
  }

  plugin.route.pre((next, opts) => {
    if (!opts.config.registry) return next.applySame()

    opts.pre.push(registryMiddleware)
    return next(opts)
  })
}

module.exports = plugiator.create({
  name: 'registry',
  dependencies: 'registry-store',
}, register)
