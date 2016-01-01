'use strict';

process.on('unhandledRejection', function(reason, p) {
  console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});

const config = require('./config');
const Hapi = require('hapi');
const chalk = require('chalk');

function CdnServer(opts) {
  opts = opts || {};
  this._src = opts.src;
  this._port = opts.port || config.get('port');
  this._internalCacheExpiresIn = opts.internalCacheExpiresIn || 1;
}

CdnServer.prototype.start = function() {
  return new Promise((resolve, reject) => {
    let server = new Hapi.Server({
      debug: {
        log: ['error'],
        request: ['error'],
      },
      /*cache: [
        {
          name: 'redisCache',
          engine: require('catbox-redis'),
          host: '127.0.0.1',
          partition: 'cache'
        }
      ]*/
    });
    server.connection({ port: this._port });

    server.register([
      {
        register: require('./app/plugins/registry'),
        options: {
          mongoURI: config.get('mongodbUrl'),
        },
      },
      {
        register: require('./app/plugins/file-max-age'),
        options: {
          maxAge: config.get('maxAge')
        }
      },
      {
        register: require('./app/plugins/bundle-service'),
        options: {
          overridePath: this._src
        }
      },
      {
        register: require('./app/web/bundle'),
        options: {
          resourcesHost: config.get('host') ||
            config.get('ip') + ':' + this._port,
          internalCacheExpiresIn: this._internalCacheExpiresIn,
        },
      },
      {
        register: require('./app/web/raw'),
      }
    ], function(err) {
      if (err) reject(err);

      server.start(function() {
        console.log('--------------------------------------');
        console.log('');
        console.log('  ' + chalk.blue('foso cdn') + ' server started');
        console.log('  Hosted on ' + chalk.magenta(server.info.uri));
        console.log('  Press Ctrl+C to stop the server');
        console.log('');
        console.log('--------------------------------------');
      });

      resolve();
    });
  });
};

exports.Server = CdnServer;
