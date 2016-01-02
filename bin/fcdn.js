#!/usr/bin/env node

'use strict';

const program = require('commander');
const pkg = require('../package.json');
const updateNotifier = require('update-notifier');
const path = require('path');
const Server = require('../').Server;

updateNotifier({
  pkg: pkg,
}).notify({
  defer: false,
});

program.version(pkg.version);

program
  .command('serve')
  .description('Serves the current package.')
  .action(function() {
    let cwd = path.resolve(process.cwd());
    let server = new Server({
      src: cwd,
    });
    server.start();
  });

program.parse(process.argv);
