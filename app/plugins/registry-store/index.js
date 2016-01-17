'use strict'
module.exports = function(plugin, opts, next) {
  let registries = opts.registries || {}

  plugin.expose('getByName', function(name, cb) {
    if (!registries[name])
      return cb(new Error('registry called ' + name + ' not found'))

    cb(null, registries[name])
  })

  next()
}

module.exports.attributes = {
  name: 'registry-store',
}
