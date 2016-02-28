'use strict'
const parseExtension = require('../../utils/parse-ext')
const Duration = require('duration-js')

module.exports = function (plugin, opts) {
  if (!opts.maxAge) {
    throw new Error('opts.maxAge is required')
  }

  function getByExtension (extension) {
    const maxAgeTimeSpan = opts.maxAge[extension] || opts.maxAge['default']
    return timeSpanToSec(maxAgeTimeSpan)
  }

  function timeSpanToSec (timeSpan) {
    if (!isNaN(Number(timeSpan))) {
      return timeSpan
    }
    const d = new Duration(timeSpan)
    return d.seconds()
  }

  plugin.expose('getByExtension', getByExtension)
  plugin.expose('getByPath', path => getByExtension(parseExtension(path).ext))
}

module.exports.attributes = {
  name: 'file-max-age',
}
