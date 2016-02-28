'use strict'
const cdnServer = require('./')

const server = cdnServer({
  internalCacheExpiresIn: 1000 * 60 * 5,
})

server.start().catch(err => console.error(err))
