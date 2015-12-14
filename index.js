'use strict';

var config = require('./config');
var Hapi = require('hapi');
const chalk = require('chalk');

function CdnServer(opts) {
  opts = opts || {};
  this._src = opts.src;
  this._port = opts.port || config.port;
  this._internalCacheExpiresIn = opts.internalCacheExpiresIn || 1;
}

CdnServer.prototype.start = function() {
  return new Promise((resolve, reject) => {
    var server = new Hapi.Server({
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
        register: require('./app/plugins/file-max-age'),
        options: {
          maxAge: config.maxAge
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
          resourcesHost: config.ip + ':' + this._port,
          internalCacheExpiresIn: this._internalCacheExpiresIn
        }
      },
      { register: require('./app/web/raw') }
    ], function(err) {
      if (err) {
        reject(err);
      }

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
