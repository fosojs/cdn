'use strict';

var Boom = require('boom');

module.exports = function(server, opts, next) {
  server.route({
    method: 'GET',
    path: '/raw/{pkgMeta}/{path*}',
    handler: function(req, reply) {
      var metaParts = req.params.pkgMeta.split('@');
      var pkg = {
        name: metaParts[0],
        version: metaParts[1] || 'latest',
        file: req.params.path || '_index.html'
      };

      server.plugins['bundle-service'].getRaw(pkg, function(err, fileStream) {
        if (err) {
          return reply(Boom.notFound(err));
        }
        reply(fileStream);
      });
    }
  });

  next();
};

module.exports.attributes = {
  name: 'web/raw',
  dependencies: ['bundle-service', 'reference-service']
};
