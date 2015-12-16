'use strict';

const expect = require('chai').expect;
const Package = require('../../../app/plugins/bundle-service/package');

describe('Package', function() {
  it('should read existing files', function(done) {
    let pkg = new Package('bar', '0.1.2', {
      registry: {
        url: 'http://registry.npmjs.org/'
      }
    });
    pkg.readFile('./lib/bar.js')
      .then(function(file) {
        expect(file).to.contain('bar.drinker =');
        return pkg.readFile('./lib/bar/core.js');
      })
      .then(function(file) {
        expect(file).to.contain("EventEmitter: require('../../vendor/EventEmitter2').EventEmitter2,");
        done();
      });
  });

  it('should throw error on reading non-existing files', function(done) {
    let pkg = new Package('bar', '0.1.2', {
      registry: {
        url: 'http://registry.npmjs.org/'
      }
    });
    pkg.readFile('./bla-bla.js')
      .catch(function(err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.contain('File no');
        done();
      });
  });

  it('should throw error when package doesn\'t exist', function(done) {
    let pkg = new Package('f3k3j8-g3g9j-j2323', '990.1.2', {
      registry: {
        url: 'http://registry.npmjs.org/'
      }
    });
    pkg.readFile('./lib/bar.js')
      .catch(function(err) {
        expect(err).to.be.instanceOf(Error);
        done();
      });
  });
});
