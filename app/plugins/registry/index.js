'use strict';

const Boom = require('Boom');

module.exports = function(plugin, opts, next) {
  if (!opts.defaultRegistry)
    return next(new Error('opts.defaultRegistry is required'));
  if (!opts.defaultRegistry.url)
    return next(new Error('opts.defaultRegistry.url is required'));

  let registries = opts.registries || {};

  let registryCache = plugin.cache({
    expiresIn: opts.internalCacheExpiresIn,
    generateTimeout: 1000 * 20,
    segment: 'registrySegment',
    generateFunc(id, next) {
      getByName(id, next);
    },
  });

  let registryStore = plugin.plugins['registry-store'] || {
    getByName(name, cb) {
      if (!registries[name])
        return cb(new Error('registry called ' + name + ' not found'));
      cb(null, registries[name]);
    },
  };

  function getByName(name, cb) {
    if (!name) return cb(null, opts.defaultRegistry);

    registryStore.getByName(name, cb);
  }

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
