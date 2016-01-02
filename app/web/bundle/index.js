'use strict';

const parseBundleRoute = require('../../utils/parse-bundle-route');
const Boom = require('boom');
const uglify = require('uglify-js');
const CleanCSS = require('clean-css');
const config = require('../../../config');
const R = require('ramda');
const fullCssUrl = require('../../utils/full-css-url');

exports.register = function(server, opts, next) {
  if (!opts.resourcesHost) {
    return next(new Error('opts.resourcesHost is required'));
  }

  let registry = server.plugins.registry;

  function bundleJavaScript(type, pkgFiles) {
    let bundleHeader = 'window.cdn=window.cdn||{};' +
      'cdn.packages=cdn.packages||{};cdn.origin="' + opts.resourcesHost + '"';
    return pkgFiles.reduce(function(memo, pkgFiles) {
      return memo + ';cdn.packages["' + pkgFiles.name +
        '"]={version:"' + pkgFiles.version + '"};' +
        pkgFiles.files.join(';');
    }, bundleHeader);
  }

  function bundleCSS(type, pkgFiles) {
    return R.compose(R.join(''), R.flatten, R.pluck('files'))(pkgFiles);
  }

  let bundleFiles = R.ifElse(
    (type) => type === 'js',
    bundleJavaScript,
    bundleCSS
  );

  function getJavaScriptTransformer(opts) {
    if (opts.options.indexOf('min') === -1)
      return code => code;

    let minify = code => uglify.minify(code, {fromString: true}).code;
    return params => R.merge(params, {
      content: minify(params.content),
    });
  }

  function getCSSTransformer(opts) {
    if (opts.options.indexOf('min') === -1)
      return fullCssUrl;

    let minify = code => new CleanCSS().minify(code).styles;
    let minifyTransformer = params => R.merge(params, {
      content: minify(params.content),
    });
    return R.compose(minifyTransformer, fullCssUrl);
  }

  let getTransformer = R.ifElse(
    opts => opts.extension === 'js',
    getJavaScriptTransformer,
    getCSSTransformer
  );

  let bundleCache = server.cache({
    //cache: 'redisCache',
    expiresIn: opts.internalCacheExpiresIn,
    generateFunc(id, next) {
      server.plugins['bundle-service']
        .get(id.paths, {
          extension: id.extension,
          transformer: getTransformer(id),
          registry: id.registry,
        }, function(err, pkgFiles) {
          if (err) return next(null, null);

          let content = bundleFiles(id.extension, pkgFiles);
          next(null, {
            content: content,
            maxAge: R.reduce(
              R.min,
              Infinity,
              R.map(R.path(['maxAge']), pkgFiles)
            ),
          });
        });
    },
    generateTimeout: 1000 * 10, /* 10 seconds */
  });

  function bundleHandler(req, reply) {
    let bundle = parseBundleRoute(req.params.bundleRoute);

    bundle.registry = req.pre.registry;
    bundle.id = req.params.account + '/' + req.params.bundleRoute;
    bundleCache.get(bundle, function(err, result) {
      if (err || !result || !result.content)
        return reply(Boom.notFound(err));

      reply(result.content)
        .type(server.mime.path(req.params.bundleRoute).type)
        .header('cache-control', 'max-age=' + result.maxAge)
        .header('Access-Control-Allow-Origin', '*');
    });
  }

  server.route({
    method: 'GET',
    path: '/bundle/{bundleRoute*}',
    config: {
      pre: [registry.pre],
    },
    handler: bundleHandler,
  });

  server.route({
    method: 'GET',
    path: '/{account}/bundle/{bundleRoute*}',
    config: {
      pre: [registry.pre],
    },
    handler: bundleHandler,
  });

  next();
};

exports.register.attributes = {
  name: 'app/bundle',
  dependencies: ['bundle-service', 'registry'],
};
