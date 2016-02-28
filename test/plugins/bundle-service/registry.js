'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const Registry = require('../../../app/plugins/bundle-service/registry')

describe('Registry', function () {
  it('should resolve version', function (done) {
    const registry = new Registry({
      registry: {
        url: 'http://registry.npmjs.org/',
      },
    })
    registry.resolve('lodash', '0')
      .then(function (pkg) {
        expect(pkg.version).to.eq('0.5.1')
        done()
      })
  })

  it('should throw error when version cannot be resolved', function (done) {
    const registry = new Registry({
      registry: {
        url: 'http://registry.npmjs.org/',
      },
    })
    registry.resolve('lodash', '0.99.99')
      .catch(function (err) {
        expect(err).to.be.instanceOf(Error)
        done()
      })
  })
})
