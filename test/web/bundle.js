'use strict';

const expect = require('chai').expect;
const Hapi = require('hapi');
const R = require('ramda');
const bundleService = require('../../app/plugins/bundle-service');
const fileMaxAge = require('../../app/plugins/file-max-age');
const bundle = require('../../app/web/bundle');
const compareToFile = require('./compare-to-file');
const path = require('path');
const decamelize = require('decamelize');

let extensionContentType = {
  js: 'text/javascript',
  css: 'text/css',
};

let tests = [
  {
    name: 'should bundle one file',
    path: '/bundle/applyq@0.2.1(index).js',
    expected: {
      fileName: 'test1',
      headers: {
        contentType: 'text/javascript; charset=utf-8',
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
        contentType: 'text/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should bundle resolve package',
    path: '/bundle/applyq@0.1.js',
    expected: {
      fileName: 'test2',
      headers: {
        contentType: 'text/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should load package with no version specified',
    path: '/bundle/applyq(index).js',
    expected: {
      fileName: 'test1',
      headers: {
        contentType: 'text/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should load package with no version and file specified',
    path: '/bundle/applyq.js',
    expected: {
      fileName: 'test1',
      headers: {
        contentType: 'text/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should load two packages with files',
    path: '/bundle/applyq,kamikaze(index).js',
    expected: {
      fileName: 'test3',
      headers: {
        contentType: 'text/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should load one package with two files',
    path: '/bundle/test-foo@1.0.1(lib/sum+lib/includes).js',
    expected: {
      fileName: 'test4',
      headers: {
        contentType: 'text/javascript; charset=utf-8',
      },
    },
  },
  {
    name: 'should minify',
    path: '/bundle/applyq@0.2.1(index).min.js',
    expected: {
      fileName: 'test1.min',
      headers: {
        contentType: 'text/javascript; charset=utf-8',
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
    overridePath: path.resolve(__dirname, './local-pkg'),
    expected: {
      fileName: 'test6',
      headers: {
        contentType: 'text/javascript; charset=utf-8',
      },
    },
  },
];

let defaultParams = {
  maxAge: {
    'default': '4h',
  },
  resourcesHost: 'cdn.foso.me',
  extensionContentType,
  expected: {
    headers: {
      cacheControl: 'max-age=14400',
      accessControlAllowOrigin: '*',
    },
  },
};

describe('bundle', function() {
  tests.forEach(function(opts) {
    let test = R.merge(defaultParams, opts);
    it(test.name, function(done) {
      let server = new Hapi.Server();
      server.connection();
      server.register([{
        register: fileMaxAge,
        options: {
          maxAge: test.maxAge,
        },
      }, {
        register: bundleService,
        options: {
          overridePath: test.overridePath,
        },
      }, {
        register: bundle,
        options: {
          resourcesHost: test.resourcesHost,
          extensionContentType: test.extensionContentType,
        },
      }], function(err) {
        expect(err).to.not.exist;

        server.inject(test.path, function(res) {
          compareToFile(test.expected.fileName, res.payload);
          Object.keys(test.expected.headers).forEach(function(headerKey) {
            expect(res.headers[decamelize(headerKey, '-')])
              .to.eq(test.expected.headers[headerKey]);
          });

          done();
        });
      });
    });
  });
});
