'use strict'
const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect

const getMainFile = require('./get-main-file')

describe('getMainFile', () => {
  describe('js', () => {
    it('should get main file from package.json', () => {
      const mainFile = getMainFile({
        extension: 'js',
        packageJSON: {
          main: 'foo.js',
        },
      })

      expect(mainFile).to.eq('foo.js')
    })

    it('should get main file from package.json and add extension if missing', () => {
      const mainFile = getMainFile({
        extension: 'js',
        packageJSON: {
          main: 'foo',
        },
      })

      expect(mainFile).to.eq('foo.js')
    })

    it('should get default main file when none in package.json', () => {
      const mainFile = getMainFile({
        extension: 'js',
        packageJSON: {},
      })

      expect(mainFile).to.eq('index.js')
    })
  })

  describe('css', () => {
    it('should get main file from package.json', () => {
      const mainFile = getMainFile({
        extension: 'css',
        packageJSON: {
          style: 'foo.css',
        },
      })

      expect(mainFile).to.eq('foo.css')
    })

    it('should get main file from package.json and add extension if missing', () => {
      const mainFile = getMainFile({
        extension: 'css',
        packageJSON: {
          style: 'foo',
        },
      })

      expect(mainFile).to.eq('foo.css')
    })

    it('should get default main file when none in package.json', () => {
      const mainFile = getMainFile({
        extension: 'css',
        packageJSON: {},
      })

      expect(mainFile).to.eq('index.css')
    })
  })
})
