'use strict'
module.exports = pkg

const RegClient = require('npm-registry-client')
const tar = require('tar-fs')
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const normalize = require('normalize-path')
const chalk = require('chalk')
const debug = require('debug')('cdn')
const streamToString = require('stream-to-string')
const buildFileTree = require('./build-file-tree')

const regClient = new RegClient()

function pkg (opts) {
  opts = opts || {}

  if (!opts.pkg) {
    throw new Error('opts.pkg is required')
  }

  if (!opts.pkg.name) {
    throw new Error('opts.pkg.name is required')
  }

  const name = opts.pkg.name

  if (!opts.pkg.version) {
    throw new Error('opts.pkg.version is required')
  }

  const version = opts.pkg.version

  if (!opts.registry) {
    throw new Error('opts.registry is required')
  }

  const registry = opts.registry

  if (!opts.storagePath) {
    throw new Error('opts.storagePath is required')
  }

  const storagePath = opts.storagePath

  const directory = getDirectory()

  const tarballURL = getTarballURL()

  const isCached = fs.existsSync(directory)

  function download (callback) {
    if (isCached) return callback(null)

    debug('downloading tarball: ' + chalk.magenta(tarballURL))

    regClient.fetch(tarballURL, {
      auth: {
        token: registry.token,
      },
    }, (err, res) => {
      if (err) return callback(err)

      res
        .pipe(zlib.createGunzip())
        .on('error', callback)
        .pipe(tar.extract(directory))
        .on('finish', () => {
          debug('tarball downloaded: ' + chalk.magenta(tarballURL))
          buildFileTree({name, version, directory}, callback)
        })
        .on('error', callback)
    })
  }

  function streamFile (filename) {
    return new Promise((resolve, reject) => {
      const file = path.resolve(directory, 'package', filename)

      download(err => {
        if (err) {
          return reject(err)
        }

        if (!fs.existsSync(file)) {
          return reject(new Error('File not found: ' + file))
        }

        return resolve(fs.createReadStream(file))
      })
    })
  }

  function readFile (filename) {
    return streamFile(filename).then(streamToString)
  }

  return {
    streamFile,
    readFile,
  }

  function getTarballURL () {
    let justPkgName
    if (name[0] !== '@') {
      justPkgName = name
    } else {
      justPkgName = name.split('/')[1]
    }
    return `${registry.url}${name}/-/${justPkgName}-${version}.tgz`
  }

  function getDirectory () {
    const packageFolder = name.replace('/', '--')
    return normalize(
      path.resolve(storagePath, packageFolder, version)
    )
  }
}
