'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const downloadPkg = require('./download-pkg')
const path = require('path')

describe('Package', function () {
  it('should read existing files', function () {
    return downloadPkg({
      pkg: {
        name: 'bar',
        version: '0.1.2',
      },
      registry: {
        url: 'http://registry.npmjs.org/',
      },
      storagePath: path.resolve(process.cwd(), './.cdn-cache'),
    })
    .then((pkg) => {
      return pkg.readFile('./lib/bar.js')
        .then(function (file) {
          expect(file).to.contain('bar.drinker =')
          return pkg.readFile('./lib/bar/core.js')
        })
        .then(function (file) {
          expect(file).to.contain("EventEmitter: require('../../vendor/EventEmitter2').EventEmitter2,")
        })
    })
  })

  it('should throw error on reading non-existing files', function (done) {
    return downloadPkg({
      pkg: {
        name: 'bar',
        version: '0.1.2',
      },
      registry: {
        url: 'http://registry.npmjs.org/',
      },
      storagePath: path.resolve(process.cwd(), './.cdn-cache'),
    })
    .then((pkg) => {
      return pkg.readFile('./bla-bla.js')
        .catch(function (err) {
          expect(err).to.be.instanceOf(Error)
          expect(err.message).to.contain('File no')
          done()
        })
    })
  })

  it.skip('should throw error when package doesn\'t exist', function (done) {
    return downloadPkg({
      pkg: {
        name: 'f3k3j8-g3g9j-j2323',
        version: '990.1.2',
      },
      registry: {
        url: 'http://registry.npmjs.org/',
      },
      storagePath: path.resolve(process.cwd(), './.cdn-cache'),
    })
    .then((pkg) => {
      return pkg.readFile('./lib/bar.js')
        .catch(err => {
          expect(err).to.be.instanceOf(Error)
          done()
        })
    })
  })
})
