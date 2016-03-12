'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const packageCreate = require('../../../app/plugins/bundle-service/package')
const path = require('path')

describe('Package', function () {
  it('should read existing files', function () {
    const pkg = packageCreate('bar', '0.1.2', {
      registry: {
        url: 'http://registry.npmjs.org/',
      },
      storagePath: path.resolve(__dirname, '../../../.cdn-cache'),
    })
    return pkg.readFile('./lib/bar.js')
      .then(function (file) {
        expect(file).to.contain('bar.drinker =')
        return pkg.readFile('./lib/bar/core.js')
      })
      .then(function (file) {
        expect(file).to.contain("EventEmitter: require('../../vendor/EventEmitter2').EventEmitter2,")
      })
  })

  it('should throw error on reading non-existing files', function (done) {
    const pkg = packageCreate('bar', '0.1.2', {
      registry: {
        url: 'http://registry.npmjs.org/',
      },
      storagePath: path.resolve(__dirname, '../../../.cdn-cache'),
    })
    pkg.readFile('./bla-bla.js')
      .catch(function (err) {
        expect(err).to.be.instanceOf(Error)
        expect(err.message).to.contain('File no')
        done()
      })
  })

  it.skip('should throw error when package doesn\'t exist', function (done) {
    const pkg = packageCreate('f3k3j8-g3g9j-j2323', '990.1.2', {
      registry: {
        url: 'http://registry.npmjs.org/',
      },
      storagePath: path.resolve(__dirname, '../../../.cdn-cache'),
    })
    pkg.readFile('./lib/bar.js')
      .catch(err => {
        expect(err).to.be.instanceOf(Error)
        done()
      })
  })
})
