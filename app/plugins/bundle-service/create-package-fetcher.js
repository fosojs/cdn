'use strict'
module.exports = creaetPackageFetcher

const path = require('path')
const createLocalPackageReader = require('./local-package')
const downloadPkg = require('./download-pkg')
const createRegistry = require('./registry')
const chalk = require('chalk')
const debug = require('debug')('cdn')
const Rx = require('rx')

function creaetPackageFetcher (opts) {
  const storagePath = opts.storagePath

  const overrides = {}
  if (opts.overridePath) {
    const overridePkg = require(path.join(opts.overridePath, 'package.json'))
    overrides[overridePkg.name] = {
      path: opts.overridePath,
      packageJSON: overridePkg,
    }
  }

  return fetchPackage

  function fetchPackage (opts) {
    if (overrides[opts.requestedPkg.name]) {
      const override = overrides[opts.requestedPkg.name]

      debug('The requested package ' + chalk.blue(opts.requestedPkg.name) +
        ' is overriden locally with ' +
        chalk.magenta(override.path))

      const pkgReader = createLocalPackageReader(override.path)

      return Rx.Observable.of({
        fs: pkgReader,
        json: override.packageJSON,
        isOverriden: true,
      })
    }

    const registry = createRegistry(opts.registry)

    return Rx.Observable.fromPromise(registry.resolve(opts.requestedPkg))
      .flatMap(matchingPkgJSON =>
        getPackageLoader(opts.requestedPkg, matchingPkgJSON, opts))
  }

  function getPackageLoader (requestedPkg, matchingPkgJSON, opts) {
    if (!matchingPkgJSON) {
      debug('No matching version found for ' + fullNameH(requestedPkg))

      return Rx.Observable.throw(new Error('no matching version found for ' +
        fullName(requestedPkg)))
    }

    if (matchingPkgJSON.version !== requestedPkg.version) {
      debug(fullNameH(requestedPkg) + ' resolved to ' +
        fullNameH(matchingPkgJSON))
    }

    return Rx.Observable.fromPromise(downloadPkg({
        pkg: matchingPkgJSON,
        registry: opts.registry,
        storagePath,
      }))
      .map(pkgReader => ({
        fs: pkgReader,
        json: matchingPkgJSON,
        isOverriden: false,
      }))
  }
}

function fullName (pkg) {
  return pkg.name + '@' + pkg.version
}

function fullNameH (pkg) {
  return chalk.blue(fullName(pkg))
}
