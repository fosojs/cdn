'use strict'
module.exports = bundleService

const R = require('ramda')
const Rx = require('rx')
const getMainFile = require('./get-main-file')
const createPackageFetcher = require('./create-package-fetcher')
const fileMaxAge = require('../file-max-age')

function bundleService (opts) {
  if (!opts.storagePath) {
    return new Error('opts.storagePath is required')
  }

  const maxAge = fileMaxAge({
    maxAge: opts.maxAge,
  })

  const fetchPackage = createPackageFetcher(opts)

  return { get: get, getRaw }

  function get (requestedPackages, opts) {
    opts = opts || {}
    if (!opts.registry) {
      throw new Error('opts.registry is required')
    }
    if (!opts.extension) {
      throw new Error('opts.extension is required')
    }
    if (!opts.transformer) {
      throw new Error('opts.transformer is required')
    }

    return Rx.Observable.for(requestedPackages, Rx.Observable.just)
      .flatMapWithMaxConcurrent(1, requestedPkg => {
        function getFiles (matchingPkg) {
          if (requestedPkg.files && requestedPkg.files.length)
            return requestedPkg.files

          return [
            getMainFile({
              packageJSON: matchingPkg,
              extension: opts.extension,
            }),
          ]
        }

        return fetchPackage({
          requestedPkg,
          registry: opts.registry,
        })
        .flatMap(pkg => {
          return Rx.Observable
            .for(getFiles(pkg.json), Rx.Observable.just)
            .flatMapWithMaxConcurrent(1, filePath =>
              Rx.Observable.fromPromise(pkg.fs.readFile(filePath))
                .map(content => ({
                  content,
                  pkg: {
                    name: pkg.json.name,
                    version: pkg.json.version,
                    filePath,
                  },
                }))
                .map(opts.transformer)
                .pluck('content')
            )
            .reduce(R.concat, [])
            .map(files => ({
              name: pkg.json.name,
              version: pkg.json.version,
              files,
              maxAge: pkg.isOverriden ?
                0 : maxAge.getByExtension(opts.extension),
            }))
        })
      })
      .reduce(R.concat, [])
      .toPromise()
  }

  function getRaw (requestedPkg, opts) {
    opts = opts || {}
    if (!opts.registry) {
      throw new Error('opts.registry is required')
    }

    const fetchPackage$ = fetchPackage({
      requestedPkg,
      registry: opts.registry,
    })

    return Rx.Observable.combineLatest(
      fetchPackage$.pluck('isOverriden'),
      fetchPackage$.flatMap(pkg => pkg.fs.streamFile(requestedPkg.file)),
      (isOverriden, stream) => ({
        stream,
        maxAge: isOverriden ?
          0 : maxAge.getByPath(requestedPkg.file),
      })
    )
    .toPromise()
  }
}
