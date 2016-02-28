'use strict'
module.exports = (plugin, opts) => {
  const registries = opts.registries || {}

  plugin.expose('getByName', (name, cb) => {
    if (!registries[name]) {
      return cb(new Error('registry called ' + name + ' not found'))
    }

    cb(null, registries[name])
  })
}

module.exports.attributes = {
  name: 'registry-store',
}
