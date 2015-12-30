'use strict';

const parseBundleRoute = require('../../utils/parse-bundle-route');
const Boom = require('boom');
const uglify = require('uglify-js');
const CleanCSS = require('clean-css');
const config = require('../../../config');
const R = require('ramda');
const fullCssUrl = require('../../utils/full-css-url');

exports.register = function(server, opts, next) {
  let extContentType = opts.extensionContentType || {};
  if (!opts.resourcesHost) {
    return next(new Error('opts.resourcesHost is required'));
  }

  let Registry = server.plugins.registry;

  function bundleFiles(type, pkgFiles) {
    if (type === 'js') {
      let bundle = 'window.cdn=window.cdn||{};' +
        'cdn.packages=cdn.packages||{};cdn.origin="' + opts.resourcesHost + '"';
      bundle += pkgFiles.reduce(function(memo, pkgFiles) {
        return memo + ';cdn.packages["' + pkgFiles.name +
          '"]={version:"' + pkgFiles.version + '"};' +
          pkgFiles.files.join(';');
      }, '');
      return bundle;
    }
    return pkgFiles.reduce(function(memo, pkgFiles) {
      return memo + pkgFiles.files.join('');
    }, '');
  }

  let registryCache = server.cache({
    expiresIn: opts.internalCacheExpiresIn,
    generateTimeout: 1000 * 10,
    segment: 'registrySegment',
    generateFunc(id, next) {
      Registry.getByName(id, next);
    },
  });

  let bundleCache = server.cache({
    //cache: 'redisCache',
    expiresIn: opts.internalCacheExpiresIn,
    generateFunc(id, next) {
      let transformer;
      if (id.options.indexOf('min') !== -1) {
        if (id.extension === 'js') {
          transformer = params => R.merge(params, {
            content: uglify.minify(params.content, {fromString: true}).code
          });
        } else {
          let minifyTransformer = params => R.merge(params, {
            content: new CleanCSS().minify(params.content).styles
          });
          transformer = R.compose(minifyTransformer, fullCssUrl);
        }
      } else {
        transformer = code => code;
      }
      server.plugins['bundle-service']
        .get(id.paths, {
          extension: id.extension,
          transformer: transformer,
          registry: id.registry
        }, function(err, pkgFiles) {
          if (err) return next(null, null);

          let content = bundleFiles(id.extension, pkgFiles);
          next(null, {
            content: content,
            maxAge: R.reduce(
              R.min,
              Infinity,
              R.map(R.path(['maxAge']), pkgFiles)
            )
          });
        });
    },
    generateTimeout: 1000 * 10 /* 10 seconds */
  });

  function getRegistry(name, cb) {
    if (name) return registryCache.get(name, cb);

    cb(null, config.get('registry'));
  }

  function bundleHandler(req, reply) {
    getRegistry(req.params.account, function(err, registry) {
      if (err)
        return reply(Boom.notFound('Passed account not found'));

      let bundle = parseBundleRoute(req.params.bundleRoute);

      bundle.registry = registry;
      bundle.id = req.params.account + '/' + req.params.bundleRoute;
      bundleCache.get(bundle, function(err, result) {
        if (err || !result || !result.content)
          return reply(Boom.notFound(err));

        reply(result.content)
          .type(extContentType[bundle.extension])
          .header('cache-control', 'max-age=' + result.maxAge)
          .header('Access-Control-Allow-Origin', '*');
      });
    });
  }

  server.route({
    method: 'GET',
    path: '/bundle/{bundleRoute*}',
    handler: bundleHandler
  });

  server.route({
    method: 'GET',
    path: '/{account}/bundle/{bundleRoute*}',
    handler: bundleHandler
  });

  next();
};

exports.register.attributes = {
  name: 'app/bundle',
  dependencies: ['bundle-service']
};
