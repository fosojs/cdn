'use strict';

var Server = require('./').Server;

var server = new Server({
  internalCacheExpiresIn: 1000 * 60 * 5
});

server.start();
