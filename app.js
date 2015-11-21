'use strict';

var config = require('./config');
var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({ port: config.port });

var sharedOptions = { storagePath: config.storagePath };
server.register([
  { register: require('./app/bundle'), options: sharedOptions },
  { register: require('./app/publish'), options: sharedOptions },
  { register: require('./app/publish-file'), options: sharedOptions },
  { register: require('./app/packages'), options: sharedOptions },
  { register: require('./app/push'), options: sharedOptions },
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
