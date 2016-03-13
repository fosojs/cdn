'use strict'
module.exports = getMainFile

const debug = require('debug')('cdn')
const chalk = require('chalk')

const mainFields = {
  js: 'main',
  css: 'style',
}

const defaultMainFiles = {
  js: 'index.js',
  css: 'index.css',
}

function getMainFile (opts) {
  const mainField = mainFields[opts.extension]
  const mainFile = opts.packageJSON[mainField] ||
    defaultMainFiles[opts.extension]

  debug('File not specified. Loading main file: ' + chalk.magenta(mainFile))

  return ensureHasExtension(opts.extension, mainFile)
}

function ensureHasExtension (extension, filename) {
  const end = '.' + extension

  if (filename.indexOf(end) !== -1)
    return filename

  return filename + end
}
