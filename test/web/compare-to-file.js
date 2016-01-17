'use strict'
const expect = require('chai').expect
const fs = require('fs')
const path = require('path')
const R = require('ramda')

function normalizeNewline(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string')
  }

  return str.replace(/\r\n/g, '\n').replace(/\n*$/, '')
}

function readFile(fileName) {
  let filePath = path.join(__dirname, './files', fileName + '.txt')
  return fs.readFileSync(filePath, 'utf8')
}

function compareToFile(fileName, payload) {
  let normalizedPayload = normalizeNewline(payload)
  let expectedResult = R.compose(normalizeNewline, readFile)(fileName)
  expect(normalizedPayload.length).to.eq(expectedResult.length)
  expect(normalizedPayload).to.eq(expectedResult)
}

module.exports = compareToFile
