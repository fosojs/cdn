'use strict'
module.exports = pkg

const RegClient = require('npm-registry-client')
const tar = require('tar-fs')
const zlib = require('zlib')
const findit = require('findit')
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')
const normalize = require('normalize-path')
const chalk = require('chalk')
const debug = require('debug')('cdn')
const streamToString = require('stream-to-string')

const regClient = new RegClient()

function pkg (name, version, opts) {
  opts = opts || {}

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

  function readJSON () {
    return require(path.resolve(directory, 'package', 'package.json'))
  }

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
          buildFileTree(callback)
        })
        .on('error', callback)
    })
  }

  let files

  function buildFileTree (callback) {
    const finder = findit(directory)
    files = []

    debug('building file tree')

    finder.on('file', (file, stat) => {
      files.push(normalize(file)
        .replace(directory + '/package/', ''))
    })

    finder.on('end', () => {
      debug('built file tree')
      writeIndexFiles(callback)
    })
  }

  function writeIndexFiles (callback) {
    const indexTemplate = handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, './index.template.hbs'), 'utf-8')
    )

    debug('writing _index.json')

    fs.writeFileSync(
      path.resolve(directory, 'package', '_index.json'),
      JSON.stringify(files, null, 2)
    )

    debug('writing _index.html')

    fs.writeFileSync(
      path.resolve(directory, 'package', '_index.html'),
      indexTemplate({
        name,
        version,
        files,
      })
    )

    debug('wrote index files')

    callback(null)
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

        if (filename === 'package.json') {
          return resolve(fs.createReadStream(file))
        }

        const json = readJSON()

        if (json.icon && json.icon === filename) {
          return resolve(fs.createReadStream(file))
        }

        if (process.env.RESTRICTED_ACCESS) {
          return reject(new Error('I only serve package.json files and package icons these days.'))
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
