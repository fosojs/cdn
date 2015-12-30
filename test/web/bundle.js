'use strict';

const expect = require('chai').expect;
const Hapi = require('hapi');
const R = require('ramda');
const bundleService = require('../../app/plugins/bundle-service');
const fileMaxAge = require('../../app/plugins/file-max-age');
const bundle = require('../../app/web/bundle');
const compareToFile = require('./compare-to-file');

let extensionContentType = {
  js: 'text/javascript',
  css: 'text/css',
};

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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq@0.2.1(index).js', function(res) {
        compareToFile('test1', res.payload);
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should set max age', function(done) {
    let server = new Hapi.Server();
    server.connection();
    server.register([{
      register: fileMaxAge,
      options: {
        maxAge: {
          'default': '4h',
          js: '1h',
        },
      },
    }, {
      register: bundleService,
    }, {
      register: bundle,
      options: {
        resourcesHost: 'cdn.foso.me',
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq@0.2.1(index).js', function(res) {
        compareToFile('test1', res.payload);
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=3600');
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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq@0.1.js', function(res) {
        compareToFile('test2', res.payload);
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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq(index).js', function(res) {
        compareToFile('test1', res.payload);
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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq.js', function(res) {
        compareToFile('test1', res.payload);
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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq,kamikaze(index).js', function(res) {
        compareToFile('test3', res.payload);
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should load one package with two files', function(done) {
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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/lodash@3.10.1(collection/pluck+string).js', function(res) {
        compareToFile('test4', res.payload);
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should minify', function(done) {
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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/applyq@0.2.1(index).min.js', function(res) {
        compareToFile('test1.min', res.payload);
        expect(res.headers['content-type']).to.eq('text/javascript; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should concat css', function(done) {
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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/semantic-ui@2.1.6(dist/components/feed+dist/components/comment).css', function(res) {
        compareToFile('test5', res.payload);
        expect(res.headers['content-type']).to.eq('text/css; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });

  it('should minimize css', function(done) {
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
        extensionContentType,
      },
    }], function(err) {
      expect(err).to.not.exist;

      server.inject('/bundle/semantic-ui@2.1.6(dist/components/feed+dist/components/comment).min.css', function(res) {
        compareToFile('test5.min', res.payload);
        expect(res.headers['content-type']).to.eq('text/css; charset=utf-8');
        expect(res.headers['cache-control']).to.eq('max-age=14400');
        expect(res.headers['access-control-allow-origin']).to.eq('*');

        done();
      });
    });
  });
});
