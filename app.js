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

var destPath = './files';
var opts = {
  port: '9595',
  ip: 'localhost'
};

var app = connect();
app.use(serveStatic(destPath));
app.use('/publish', postPublish(destPath));
app.use('/publish-file', postPublishFile(destPath));
app.use('/packages', packages(destPath));
app.use('/bundle', bundle(destPath));
app.use('/push', bodyParser.json());
app.use('/push', push(destPath));
http.createServer(app).listen(opts.port, opts.ip, function(err) {
  if (err) {
    console.log(err);
    return;
  }

  console.log('--------------------------------------');
  console.log('');
  console.log('  Ung server started');
  console.log('  Hosted on http://localhost:' + opts.port);
  console.log('  Press Ctrl+C to stop the server');
  console.log('');
  console.log('--------------------------------------');
});
