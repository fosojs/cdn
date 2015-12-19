'use strict';

const expect = require('chai').expect;
const fullCssUrl = require('../../app/utils/full-css-url');

describe('full css urls', function() {
  it('should replace relative URL', function() {
    let result = fullCssUrl({
      content: '.a{background-image: url(../bar.png)}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css'
      }
    });

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/bar.png")}');
  });

  it('should replace relative URL when filePath doesn\'t have a leading slash', function() {
    let result = fullCssUrl({
      content: '.a{background-image: url(../bar.png)}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: 'some/path/boo.css'
      }
    });

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/bar.png")}');
  });

  it('should replace relative URL in single quotes', function() {
    let result = fullCssUrl({
      content: '.a{background-image: url(\'../bar.png\')}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css'
      }
    });

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/bar.png")}');
  });

  it('should replace relative URL in double quotes', function() {
    let result = fullCssUrl({
      content: '.a{background-image: url("../bar.png")}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css'
      }
    });

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/bar.png")}');
  });

  it('should replace relative URL pointing to the same folder', function() {
    let result = fullCssUrl({
      content: '.a{background-image: url(bar.png)}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css'
      }
    });

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/path/bar.png")}');
  });

  it('should not replace absolute URL', function() {
    let result = fullCssUrl({
      content: '.a{background-image: url(http://foo.com/bar.png)}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css'
      }
    });

    expect(result.content).to.eq('.a{background-image: url("http://foo.com/bar.png")}');
  });

  it('should replace relative URL in import', function() {
    let result = fullCssUrl({
      content: '@import "../bar.png";',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css'
      }
    });

    expect(result.content).to.eq('@import url("/raw/foo@1.0.0/some/bar.png");');
  });
});
