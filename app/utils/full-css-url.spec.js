'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const fullCssUrl = require('./full-css-url')

describe('full css urls', function () {
  it('should replace relative URL', function () {
    const result = fullCssUrl({
      content: '.a{background-image: url(../bar.png)}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css',
      },
    })

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/bar.png")}')
  })

  it("should replace relative URL when filePath doesn't have a leading slash", function () {
    const result = fullCssUrl({
      content: '.a{background-image: url(../bar.png)}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: 'some/path/boo.css',
      },
    })

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/bar.png")}')
  })

  it('should replace relative URL in single quotes', function () {
    const result = fullCssUrl({
      content: ".a{background-image: url('../bar.png')}",
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css',
      },
    })

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/bar.png")}')
  })

  it('should replace relative URL in double quotes', function () {
    const result = fullCssUrl({
      content: '.a{background-image: url("../bar.png")}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css',
      },
    })

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/bar.png")}')
  })

  it('should replace relative URL pointing to the same folder', function () {
    const result = fullCssUrl({
      content: '.a{background-image: url(bar.png)}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css',
      },
    })

    expect(result.content).to.eq('.a{background-image: url("/raw/foo@1.0.0/some/path/bar.png")}')
  })

  it('should not replace absolute URL', function () {
    const result = fullCssUrl({
      content: '.a{background-image: url(http://foo.com/bar.png)}',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css',
      },
    })

    expect(result.content).to.eq('.a{background-image: url("http://foo.com/bar.png")}')
  })

  it('should replace relative URL in import', function () {
    const result = fullCssUrl({
      content: '@import "../bar.png"',
      pkg: {
        name: 'foo',
        version: '1.0.0',
        filePath: '/some/path/boo.css',
      },
    })

    expect(result.content).to.eq('@import url("/raw/foo@1.0.0/some/bar.png")')
  })
})
