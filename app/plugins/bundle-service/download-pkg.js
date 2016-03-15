'use strict'
module.exports = downloadPkg

const RegClient = require('npm-registry-client')
const tar = require('tar-fs')
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const normalize = require('normalize-path')
const chalk = require('chalk')
const debug = require('debug')('cdn')
const buildFileTree = require('./build-file-tree')
const localPackageReader = require('./local-package')

const regClient = new RegClient()

function downloadPkg (opts) {
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

  const isCached = fs.existsSync(directory)

  if (isCached) {
    return Promise.resolve(createPkgReader())
  }

  return new Promise((resolve, reject) => {
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
        .pipe(tar.extract(directory, {
            map (header) {
              header.name = header.name.replace(/^package\//, '')
              return header
            },
          }))
        .on('finish', () => {
          debug('tarball downloaded: ' + chalk.magenta(tarballURL))
          buildFileTree({name, version, directory}, () => {
            resolve(createPkgReader())
          })
        })
        .on('error', reject)
    })
  })

  function createPkgReader () {
    return localPackageReader(directory)
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
