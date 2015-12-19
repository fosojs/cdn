'use strict';

const expect = require('chai').expect;
const parseBundleRoute = require('../../app/utils/parse-bundle-route');

describe('parse package url', function() {
  it('should parse one package with version', function() {
    let bundle = parseBundleRoute('foo@4.2.1.js');
    expect(bundle.extension).to.eq('js');
    expect(bundle.paths.length).to.eq(1);
    expect(bundle.paths[0].name).to.eq('foo');
    expect(bundle.paths[0].version).to.eq('4.2.1');
    expect(bundle.paths[0].files).to.be.undefined;
  });

  it('should parse one package with no version', function() {
    let bundle = parseBundleRoute('foo.js');
    expect(bundle.extension).to.eq('js');
    expect(bundle.paths.length).to.eq(1);
    expect(bundle.paths[0].name).to.eq('foo');
    expect(bundle.paths[0].version).to.eq('*');
    expect(bundle.paths[0].files).to.be.undefined;
  });

  it('should parse two bundle.paths', function() {
    let bundle = parseBundleRoute('foo@3,bar@1.2.js');
    expect(bundle.extension).to.eq('js');
    expect(bundle.paths.length).to.eq(2);
    expect(bundle.paths[0].name).to.eq('foo');
    expect(bundle.paths[0].version).to.eq('3');
    expect(bundle.paths[1].name).to.eq('bar');
    expect(bundle.paths[1].version).to.eq('1.2');
    expect(bundle.paths[0].files).to.be.undefined;
    expect(bundle.paths[1].files).to.be.undefined;
  });

  it('should parse package with version and files', function() {
    let bundle = parseBundleRoute('foo@3(bar+lib/index.js+lib/qar).js');
    expect(bundle.extension).to.eq('js');
    expect(bundle.paths.length).to.eq(1);
    expect(bundle.paths[0].name).to.eq('foo');
    expect(bundle.paths[0].version).to.eq('3');
    expect(bundle.paths[0].files.length).to.eq(3);
    expect(bundle.paths[0].files[0]).to.eq('bar.js');
    expect(bundle.paths[0].files[1]).to.eq('lib/index.js');
    expect(bundle.paths[0].files[2]).to.eq('lib/qar.js');
  });

  it('should parse named bundle', function() {
    let bundle = parseBundleRoute('@foo.js');
    expect(bundle.extension).to.eq('js');
    expect(bundle.paths.length).to.eq(1);
    expect(bundle.paths[0]).to.eq('foo');
  });

  it('should parse named bundle and package', function() {
    let bundle = parseBundleRoute('@foo,bar.js');
    expect(bundle.extension).to.eq('js');
    expect(bundle.paths.length).to.eq(2);
    expect(bundle.paths[0]).to.eq('foo');
    expect(bundle.paths[1].name).to.eq('bar');
    expect(bundle.paths[1].version).to.eq('*');
  });
});
