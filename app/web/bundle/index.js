'use strict'
const parseBundleRoute = require('../../utils/parse-bundle-route')
const uglify = require('uglify-js')
const CleanCSS = require('clean-css')
const R = require('ramda')
const fullCssUrl = require('../../utils/full-css-url')
const mime = require('mime')

exports.register = function (server, opts) {
  if (!opts.bundleService) {
    return new Error('opts.bundleService is required')
  }

  if (!opts.resourcesHost) {
    return new Error('opts.resourcesHost is required')
  }

  function wrapPkgFiles (pkgFiles) {
    return `;cdn.packages[${JSON.stringify(pkgFiles.name)}]=` +
      `{version:${JSON.stringify(pkgFiles.version)}};` +
      pkgFiles.files.join(';')
  }

  function bundleJavaScript (type, pkgFiles) {
    const bundleHeader = 'window.cdn=window.cdn||{};' +
      'cdn.packages=cdn.packages||{};cdn.origin=' +
      JSON.stringify(opts.resourcesHost)
    return R.compose(
      R.reduce(R.concat, bundleHeader),
      R.map(wrapPkgFiles)
    )(pkgFiles)
  }

  function bundleCSS (type, pkgFiles) {
    return R.compose(R.join(''), R.flatten, R.pluck('files'))(pkgFiles)
  }

  const bundleFiles = R.ifElse(
    type => type === 'js',
    bundleJavaScript,
    bundleCSS
  )

  function getJavaScriptTransformer (opts) {
    if (opts.options.indexOf('min') === -1)
      return code => code

    const minify = code => uglify.minify(code, {fromString: true}).code
    return params => R.merge(params, {
      content: minify(params.content),
    })
  }

  function getCSSTransformer (opts) {
    if (opts.options.indexOf('min') === -1)
      return fullCssUrl

    const minify = code => new CleanCSS().minify(code).styles
    const minifyTransformer = params => R.merge(params, {
      content: minify(params.content),
    })
    return R.compose(minifyTransformer, fullCssUrl)
  }

  const getTransformer = R.ifElse(
    opts => opts.extension === 'js',
    getJavaScriptTransformer,
    getCSSTransformer
  )

  const bundleCache = server.cache({
    //cache: 'redisCache',
    expiresIn: opts.internalCacheExpiresIn,
    generateFunc (id, next) {
      opts.bundleService
        .get(id.paths, {
          extension: id.extension,
          transformer: getTransformer(id),
          registry: id.registry,
        })
        .then((pkgFiles) => {
          const content = bundleFiles(id.extension, pkgFiles)
          next(null, {
            content,
            maxAge: R.reduce(
              R.min,
              Infinity,
              R.map(R.path(['maxAge']), pkgFiles)
            ),
          })
        })
        .catch(err => next(err))
    },
    generateTimeout: 1000 * 10, // 10 seconds
  })

  server.route({
    method: 'GET',
    path: '/:account?/bundle/*',
    config: {
      registry: true,
    },
    handler (req, res) {
      const bundle = parseBundleRoute(req.params[0])

      bundle.registry = req.registry
      bundle.id = req.params.account + '/' + req.params[0]
      bundleCache.get(bundle, (err, result) => {
        if (err || !result || !result.content)
          return res.status(404)
            .set('Content-Type', 'text/plain')
            .send('Not found.')

        res
          .set('Content-Type', mime.lookup(req.params[0]))
          .set('Cache-Control', 'max-age=' + result.maxAge)
          .set('Access-Control-Allow-Origin', '*')
          .send(result.content)
      })
    },
  })
}

exports.register.attributes = {
  name: 'app/bundle',
  dependencies: ['registry'],
}
