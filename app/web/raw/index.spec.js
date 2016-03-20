'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const express = require('express')
const hexi = require('hexi')
const createBundleService = require('../../plugins/bundle-service')
const raw = require('.')
const compareToFile = require('../test/compare-to-file')
const registry = require('../../plugins/registry')
const path = require('path')
const plugiator = require('plugiator')
const request = require('supertest')

describe('raw', function () {
  it('should return js file', function (done) {
    const server = hexi(express())

    const bundleService = createBundleService({
      maxAge: {
        'default': '4h',
      },
      storagePath: path.resolve(process.cwd(), './.cdn-cache'),
    })

    server.register([
      {
        register: require('hexi-cache'),
      },
      {
        register: plugiator.noop('registry-store'),
      },
      {
        register: registry,
        options: {
          defaultRegistry: {
            url: 'https://registry.npmjs.org/',
          },
        },
      },
      {
        register: raw,
        options: {
          bundleService,
        },
      },
    ])
    .then(() => {
      request(server.express)
        .get('/raw/applyq@0.2.1/index.js')
        .expect('content-type', 'application/javascript')
        .expect('cache-control', 'max-age=14400')
        .expect('access-control-allow-origin', '*')
        .end((err, res) => {
          expect(err).to.not.exist
          compareToFile('raw-test1', res.text)
          done()
        })
    })
  })

  it('should return error when no file found', function (done) {
    const server = hexi(express())

    const bundleService = createBundleService({
      maxAge: {
        'default': '4h',
      },
      storagePath: path.resolve(process.cwd(), './.cdn-cache'),
    })

    return server.register([
      {
        register: require('hexi-cache'),
      },
      {
        register: plugiator.noop('registry-store'),
      },
      {
        register: registry,
        options: {
          defaultRegistry: {
            url: 'https://registry.npmjs.org/',
          },
        },
      },
      {
        register: raw,
        options: {
          bundleService,
        },
      },
    ])
    .then(() => {
      request(server.express)
        .get('/raw/applyqqq@0.2.1/index.js')
        .expect('content-type', 'text/plain; charset=utf-8')
        .expect(404)
        .end((err, res) => {
          expect(err).to.not.exist
          expect(res.text).to.eq('Not found: file "index.js" in package applyqqq@0.2.1')
          done()
        })
    })
  })
})
