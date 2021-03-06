'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const parseBundleRoute = require('./parse-bundle-route')

describe('parse package url', function () {
  it('should parse one package with version', function () {
    const bundle = parseBundleRoute('foo@4.2.1.js')
    expect(bundle.extension).to.eq('js')
    expect(bundle.paths.length).to.eq(1)
    expect(bundle.paths[0].name).to.eq('foo')
    expect(bundle.paths[0].version).to.eq('4.2.1')
    expect(bundle.paths[0].files).to.be.undefined
  })

  it('should parse one package with no version', function () {
    const bundle = parseBundleRoute('foo.js')
    expect(bundle.extension).to.eq('js')
    expect(bundle.paths.length).to.eq(1)
    expect(bundle.paths[0].name).to.eq('foo')
    expect(bundle.paths[0].version).to.eq('*')
    expect(bundle.paths[0].files).to.be.undefined
  })

  it('should parse two bundle.paths', function () {
    const bundle = parseBundleRoute('foo@3,bar@1.2.js')
    expect(bundle.extension).to.eq('js')
    expect(bundle.paths.length).to.eq(2)
    expect(bundle.paths[0].name).to.eq('foo')
    expect(bundle.paths[0].version).to.eq('3')
    expect(bundle.paths[1].name).to.eq('bar')
    expect(bundle.paths[1].version).to.eq('1.2')
    expect(bundle.paths[0].files).to.be.undefined
    expect(bundle.paths[1].files).to.be.undefined
  })

  it('should parse package with version and files', function () {
    const bundle = parseBundleRoute('foo@3(bar+lib/index.js+lib/qar).js')
    expect(bundle.extension).to.eq('js')
    expect(bundle.paths.length).to.eq(1)
    expect(bundle.paths[0].name).to.eq('foo')
    expect(bundle.paths[0].version).to.eq('3')
    expect(bundle.paths[0].files.length).to.eq(3)
    expect(bundle.paths[0].files[0]).to.eq('bar.js')
    expect(bundle.paths[0].files[1]).to.eq('lib/index.js')
    expect(bundle.paths[0].files[2]).to.eq('lib/qar.js')
  })

  it('should parse one scoped package with version', function () {
    const bundle = parseBundleRoute('@james/foo@4.2.1.js')
    expect(bundle.extension).to.eq('js')
    expect(bundle.paths.length).to.eq(1)
    expect(bundle.paths[0].name).to.eq('@james/foo')
    expect(bundle.paths[0].version).to.eq('4.2.1')
    expect(bundle.paths[0].files).to.be.undefined
  })
})
