'use strict'
const expect = require('chai').expect
const Hapi = require('hapi')
const R = require('ramda')
const bundleService = require('../../app/plugins/bundle-service')
const fileMaxAge = require('../../app/plugins/file-max-age')
const raw = require('../../app/web/raw')
const compareToFile = require('./compare-to-file')
const streamToString = require('stream-to-string')
const registry = require('../../app/plugins/registry')
const path = require('path')

describe('raw', function() {
  it('should return js file', function(done) {
    let server = new Hapi.Server()
    server.connection()
    server.register([
      {
        register: registry,
        options: {
          defaultRegistry: {
            url: 'https://registry.npmjs.org/',
          },
        },
      },
      {
        register: fileMaxAge,
        options: {
          maxAge: {
            'default': '4h',
          },
        },
      },
      {
        register: bundleService,
        options: {
          storagePath: path.resolve(__dirname, '../../.cdn-cache'),
        },
      },
      {
        register: raw,
      },
    ], function(err) {
      expect(err).to.not.exist

      server.inject('/raw/applyq@0.2.1/index.js', function(res) {
        compareToFile('raw-test1', res.payload)
        expect(res.headers['content-type']).to.eq('application/javascript; charset=utf-8')
        expect(res.headers['cache-control']).to.eq('max-age=14400')
        expect(res.headers['access-control-allow-origin']).to.eq('*')

        done()
      })
    })
  })
})
