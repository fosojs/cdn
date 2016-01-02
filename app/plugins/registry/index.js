'use strict';

const Boom = require('Boom');
const config = require('../../../config');

module.exports = function(plugin, opts, next) {
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
      cb(null, config.get('accounts')[name].registry);
    },
  };

  function getByName(name, cb) {
    if (!name) return cb(null, config.get('registry'));

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
