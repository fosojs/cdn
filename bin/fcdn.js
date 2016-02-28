#!/usr/bin/env node
'use strict'
const program = require('commander')
const pkg = require('../package.json')
const updateNotifier = require('update-notifier')
const path = require('path')
const cdnServer = require('../')

updateNotifier({ pkg }).notify({ defer: false })

program.version(pkg.version)

program
  .command('serve')
  .description('Serves the current package.')
  .action(() => {
    const cwd = path.resolve(process.cwd())
    const server = cdnServer({
      src: cwd,
    })
    server.start()
  })

program.parse(process.argv)
