'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const Hapi = require('hapi');
const bundleService = require('../../app/plugins/bundle-service');
const fileMaxAge = require('../../app/plugins/file-max-age');
const bundle = require('../../app/web/bundle');

function readFile(fileName) {
  return fs.readFileSync(path.join(__dirname, './files', fileName + '.txt'), 'utf8');
}

describe('bundle', function() {
  it('should bundle one file', function(done) {
    let server = new Hapi.Server();
    server.connection();
    server.register([{
      register: fileMaxAge,
      options: {
        maxAge: {
          'default': '4h',
        },
      },
    }, {
      register: bundleService,
    }, {
      register: bundle,
      options: {
        resourcesHost: 'cdn.foso.me',
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq@0.2.1(index).js', function(res) {
        expect(res.payload).to.eq(readFile('test1'));
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should bundle resolve package', function(done) {
    let server = new Hapi.Server();
    server.connection();
    server.register([{
      register: fileMaxAge,
      options: {
        maxAge: {
          'default': '4h',
        },
      },
    }, {
      register: bundleService,
    }, {
      register: bundle,
      options: {
        resourcesHost: 'cdn.foso.me',
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq@0.1.js', function(res) {
        expect(res.payload).to.eq(readFile('test2'));
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should load package with no version specified', function(done) {
    let server = new Hapi.Server();
    server.connection();
    server.register([{
      register: fileMaxAge,
      options: {
        maxAge: {
          'default': '4h',
        },
      },
    }, {
      register: bundleService,
    }, {
      register: bundle,
      options: {
        resourcesHost: 'cdn.foso.me',
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq(index).js', function(res) {
        expect(res.payload).to.eq(readFile('test1'));
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should load package with no version and file specified', function(done) {
    let server = new Hapi.Server();
    server.connection();
    server.register([{
      register: fileMaxAge,
      options: {
        maxAge: {
          'default': '4h',
        },
      },
    }, {
      register: bundleService,
    }, {
      register: bundle,
      options: {
        resourcesHost: 'cdn.foso.me',
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq.js', function(res) {
        expect(res.payload).to.eq(readFile('test1'));
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should load two packages with files', function(done) {
    let server = new Hapi.Server();
    server.connection();
    server.register([{
      register: fileMaxAge,
      options: {
        maxAge: {
          'default': '4h',
        },
      },
    }, {
      register: bundleService,
    }, {
      register: bundle,
      options: {
        resourcesHost: 'cdn.foso.me',
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq,kamikaze(index).js', function(res) {
        expect(res.payload).to.eq(readFile('test3'));
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });
});
