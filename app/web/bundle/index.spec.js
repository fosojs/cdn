'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const express = require('express')
const hexi = require('hexi')
const R = require('ramda')
const createBundleService = require('../../plugins/bundle-service')
const bundle = require('.')
const registry = require('../../plugins/registry')
const compareToFile = require('../test/compare-to-file')
const path = require('path')
const decamelize = require('decamelize')
const plugiator = require('plugiator')
const supertest = require('supertest')

const defaultParams = {
  maxAge: {
    'default': '4h',
  },
  resourcesHost: 'cdn.foso.me',
  expected: {
    headers: {
      cacheControl: 'max-age=14400',
      accessControlAllowOrigin: '*',
    },
    status: 200,
  },
}

const tests = [
  {
    name: 'should return error when the only file not found',
    path: '/bundle/applyq@0.2.122222(index).js',
    expected: {
      status: 404,
      fileContent: 'Not found.',
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    },
  },
  {
    name: 'should return error when one of the files not found',
    path: '/bundle/applyq@0.2.1(index+not_exists).js',
    expected: {
      status: 404,
      fileContent: 'Not found.',
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    },
  },
  {
    name: 'should bundle one file',
    path: '/bundle/applyq@0.2.1(index).js',
    expected: {
      fileName: 'test1',
      headers: {
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should set max age',
    path: '/bundle/applyq@0.2.1(index).js',
    maxAge: {
      js: '1h',
    },
    expected: {
      fileName: 'test1',
      headers: {
        cacheControl: 'max-age=3600',
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should bundle resolve package',
    path: '/bundle/applyq@0.1.js',
    expected: {
      fileName: 'test2',
      headers: {
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should load package with no version specified',
    path: '/bundle/applyq(index).js',
    expected: {
      fileName: 'test1',
      headers: {
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should load package with no version and file specified',
    path: '/bundle/applyq.js',
    expected: {
      fileName: 'test1',
      headers: {
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should load two packages with files',
    path: '/bundle/applyq,kamikaze(index).js',
    expected: {
      fileName: 'test3',
      headers: {
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should load one package with two files',
    path: '/bundle/test-foo@1.0.1(lib/sum+lib/includes).js',
    expected: {
      fileName: 'test4',
      headers: {
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should minify',
    path: '/bundle/applyq@0.2.1(index).min.js',
    expected: {
      fileName: 'test1.min',
      headers: {
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should concat css',
    path: '/bundle/test-foo@1.0.1(styles/bg+styles/font).css',
    expected: {
      fileName: 'test5',
      headers: {
        contentType: 'text/css; charset=utf-8',
      },
    },
  },
  {
    name: 'should minimize css',
    path: '/bundle/test-foo@1.0.1(styles/bg+styles/font).min.css',
    expected: {
      fileName: 'test5.min',
      headers: {
        contentType: 'text/css; charset=utf-8',
      },
    },
  },
  {
    name: 'should bundle local package',
    path: '/bundle/local-pkg@1.0.0(index).js',
    overridePath: path.resolve(__dirname, '../test/local-pkg'),
    expected: {
      fileName: 'test6',
      headers: {
        contentType: 'application/javascript; charset=utf-8',
      },
    },
  },
]

describe('bundle', function () {
  this.timeout(1e4)

  tests.forEach(function (opts) {
    const test = R.merge(defaultParams, opts)
    test.expected = R.merge(defaultParams.expected, opts.expected)

    it(test.name, function (done) {
      const server = hexi(express())

      const bundleService = createBundleService({
        maxAge: test.maxAge,
        overridePath: test.overridePath,
        storagePath: path.resolve(process.cwd(), './.cdn-cache'),
      })

      return server
        .register([
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
            register: bundle,
            options: {
              resourcesHost: test.resourcesHost,
              bundleService,
            },
          },
        ])
        .then(() => {
          const req = supertest(server.express)
            .get(test.path)

          req.expect(test.expected.status)

          Object.keys(test.expected.headers).forEach(function (headerKey) {
            req.expect(
              decamelize(headerKey, '-'), test.expected.headers[headerKey])
          })

          req.end(function (err, res) {
            expect(err).to.not.exist
            if (test.expected.fileName) {
              compareToFile(test.expected.fileName, res.text)
            } else {
              expect(test.expected.fileContent).eq(res.text)
            }
            done()
          })
        })
    })
  })
})
