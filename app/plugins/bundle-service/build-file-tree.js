'use strict'
module.exports = buildFileTree

const findit = require('findit')
const handlebars = require('handlebars')
const debug = require('debug')('cdn')
const normalize = require('normalize-path')
const fs = require('fs')
const path = require('path')

function buildFileTree (opts, callback) {
  opts = opts || {}

  const finder = findit(opts.directory)
  const files = []

  debug('building file tree')

  finder.on('file', (file, stat) => {
    files.push(normalize(file)
      .replace(opts.directory + '/package/', ''))
  })

  finder.on('end', () => {
    debug('built file tree')
    writeIndexFiles(callback)
  })

  function writeIndexFiles (callback) {
    const indexTemplate = handlebars.compile(
      fs.readFileSync(
        path.resolve(__dirname, './index.template.hbs'), 'utf-8'
      )
    )

    debug('writing _index.json')

    fs.writeFileSync(
      path.resolve(opts.directory, 'package', '_index.json'),
      JSON.stringify(files, null, 2)
    )

    debug('writing _index.html')

    fs.writeFileSync(
      path.resolve(opts.directory, 'package', '_index.html'),
      indexTemplate({
        name: opts.name,
        version: opts.version,
        files,
      })
    )

    debug('wrote index files')

    callback(null)
  }
}
