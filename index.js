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
          register: require('./app/plugins/file-max-age'),
          options: {
            maxAge: config.get('maxAge'),
          },
        },
        {
          register: require('./app/plugins/bundle-service'),
          options: {
            overridePath: src,
            storagePath: path.resolve(__dirname, config.get('storagePath')),
          },
        },
        {
          register: require('./app/web/bundle'),
          options: {
            resourcesHost: config.get('host') ||
              config.get('ip') + ':' + port,
            internalCacheExpiresIn: internalCacheExpiresIn,
          },
        },
        {
          register: require('./app/web/raw'),
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
