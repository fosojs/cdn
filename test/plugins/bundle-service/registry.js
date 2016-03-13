'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const createRegistry = require('../../../app/plugins/bundle-service/registry')

describe('Registry', function () {
  it('should resolve version', function (done) {
    const registry = createRegistry({
      url: 'http://registry.npmjs.org/',
    })
    registry
      .resolve({
        name: 'lodash',
        version: '0',
      })
      .then(function (pkg) {
        expect(pkg.version).to.eq('0.5.1')
        done()
      })
  })

  it('should throw error when version cannot be resolved', function (done) {
    const registry = createRegistry({
      url: 'http://registry.npmjs.org/',
    })
    registry
      .resolve({
        name: 'lodash',
        version: '0.99.99',
      })
      .catch(function (err) {
        expect(err).to.be.instanceOf(Error)
        done()
      })
  })
})
