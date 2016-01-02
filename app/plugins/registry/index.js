'use strict';

const Boom = require('Boom');

module.exports = function(plugin, opts, next) {
  if (!opts.defaultRegistry)
    return next(new Error('opts.defaultRegistry is required'));
  if (!opts.defaultRegistry.url)
    return next(new Error('opts.defaultRegistry.url is required'));

  let registryCache = plugin.cache({
    expiresIn: opts.internalCacheExpiresIn,
    generateTimeout: 1000 * 20,
    segment: 'registrySegment',
    generateFunc(id, next) {
      if (!id) return next(null, opts.defaultRegistry);

      let registryStore = plugin.plugins['registry-store'];
      if (!registryStore)
        return next(new Error('registry-store not registered'));

      if (typeof registryStore.getByName !== 'function')
        return next(new Error('registry-store doesn\' have a getByName function'));

      return registryStore.getByName(id, next);
    },
  });

  plugin.expose('pre', {
    method(req, reply) {
      registryCache.get(req.params.account, function(err, registry) {
        if (err) {
          return reply(Boom.notFound('registry not found', err));
        }

        return reply(registry);
      });
    },
    assign: 'registry',
  });

  next();
};

module.exports.attributes = {
  name: 'registry',
  dependencies: 'registry-store',
};
