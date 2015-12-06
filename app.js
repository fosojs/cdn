'use strict';

var config = require('./config');
var Hapi = require('hapi');

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
server.connection({ port: config.port });

server.register([
  {
    register: require('./app/plugins/reference-service'),
    options: {
      storagePath: config.storagePath
    }
  },
  {
    register: require('./app/plugins/bundle-service')
  },
  {
    register: require('./app/web/bundle'),
    options: {
      resourcesHost: config.ip + ':' + config.port
    }
  },
  { register: require('./app/web/push') },
  { register: require('./app/web/raw') }
], function(err) {
  if (err) {
    throw err;
  }

  server.start(function() {
    console.log('--------------------------------------');
    console.log('');
    console.log('  Ung server started');
    console.log('  Hosted on ' + server.info.uri);
    console.log('  Press Ctrl+C to stop the server');
    console.log('');
    console.log('--------------------------------------');
  });
});
