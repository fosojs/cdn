'use strict';

var http = require('http');
var connect = require('connect');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var postPublish = require('./routes/publish');
var postPublishFile = require('./routes/publish-file');
var packages = require('./routes/packages');
var bundle = require('./routes/bundle');
var push = require('./routes/push');
var config = require('./config');

var app = connect();
app.use(serveStatic(config.storagePath));
app.use('/publish', postPublish(config.storagePath));
app.use('/publish-file', postPublishFile(config.storagePath));
app.use('/packages', packages(config.storagePath));
app.use('/bundle', bundle(config.storagePath));
app.use('/push', bodyParser.json());
app.use('/push', push(config.storagePath));
http.createServer(app).listen(config.port, config.ip, function(err) {
  if (err) {
    console.log(err);
    return;
  }

  console.log('--------------------------------------');
  console.log('');
  console.log('  Ung server started');
  console.log('  Hosted on http://localhost:' + config.port);
  console.log('  Press Ctrl+C to stop the server');
  console.log('');
  console.log('--------------------------------------');
});
