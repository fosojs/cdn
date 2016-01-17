'use strict'
const Server = require('./').Server

let server = new Server({
  internalCacheExpiresIn: 1000 * 60 * 5,
})

server.start().catch(err => console.error(err))
