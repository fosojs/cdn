'use strict'
module.exports = cdnServer

process.on('unhandledRejection', function (reason, p) {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ',
    reason)
})

const config = require('./config')
const express = require('express')
const hexi = require('hexi')
const chalk = require('chalk')
const path = require('path')
const createBundleService = require('./app/plugins/bundle-service')

function cdnServer (opts) {
  opts = opts || {}
  const src = opts.src
  const port = opts.port || config.get('port')
  const internalCacheExpiresIn = opts.internalCacheExpiresIn || 1
  const plugins = opts.plugins || [
    {
      register: require('./app/plugins/registry-store'),
      options: {
        registries: config.get('registries'),
      },
    },
  ]

  return {
    start () {
      const app = express()
      const server = hexi()
      app.use(server.express)

      const bundleService = createBundleService({
        maxAge: config.get('maxAge'),
        overridePath: src,
        storagePath: path.resolve(__dirname, config.get('storagePath')),
      })

      return server.register([
        ...plugins,
        {
          register: require('hexi-cache'),
        },
        {
          register: require('./app/plugins/registry'),
          options: {
            defaultRegistry: config.get('registry'),
          },
        },
        {
          register: require('./app/web/bundle'),
          options: {
            bundleService,
            resourcesHost: config.get('host') ||
              config.get('ip') + ':' + port,
            internalCacheExpiresIn: internalCacheExpiresIn,
          },
        },
        {
          register: require('./app/web/raw'),
          options: {
            bundleService,
          },
        },
      ])
      .then(() => {
        app.listen(port, () => {
          console.log('--------------------------------------')
          console.log('')
          console.log('  ' + chalk.blue('foso cdn') + ' server started')
          console.log('  Hosted on port ' + chalk.magenta(port))
          console.log('  Press Ctrl+C to stop the server')
          console.log('')
          console.log('--------------------------------------')
        })
      })
    },
  }
}
