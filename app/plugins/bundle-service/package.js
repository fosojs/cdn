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

  let isCached = fs.existsSync(directory)

  return {
    streamFile,
    readFile,
  }

  function streamFile (filename) {
    const file = path.resolve(directory, 'package', filename)

    return download()
      .then(() => {
        if (!fs.existsSync(file)) {
          return Promise.reject(new Error('File not found: ' + file))
        }

        return Promise.resolve(fs.createReadStream(file))
      })
  }

  function readFile (filename) {
    return streamFile(filename).then(streamToString)
  }

  function download () {
    return new Promise((resolve, reject) => {
      if (isCached) return resolve()

      const tarballURL = getTarballURL()

      debug('downloading tarball: ' + chalk.magenta(tarballURL))

      regClient.fetch(tarballURL, {
        auth: {
          token: registry.token,
        },
      }, (err, res) => {
        if (err) return reject(err)

        res
          .pipe(zlib.createGunzip())
          .on('error', reject)
          .pipe(tar.extract(directory))
          .on('finish', () => {
            isCached = true
            debug('tarball downloaded: ' + chalk.magenta(tarballURL))
            buildFileTree({name, version, directory}, resolve)
          })
          .on('error', reject)
      })
    })
  }

  function getTarballURL () {
    const justPkgName = getScopelessName(name)
    return `${registry.url}${name}/-/${justPkgName}-${version}.tgz`
  }

  function getScopelessName (name) {
    if (name[0] !== '@') {
      return name
    }
    return name.split('/')[1]
  }

  function getDirectory () {
    const packageFolder = name.replace('/', '--')
    return normalize(
      path.resolve(storagePath, packageFolder, version)
    )
  }
}
