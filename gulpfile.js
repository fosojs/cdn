'use strict'
const gulp = require('gulp')
const mocha = require('gulp-mocha')
const istanbul = require('gulp-istanbul')
const plumber = require('gulp-plumber')
const clean = require('gulp-clean')
const coveralls = require('gulp-coveralls')
const path = require('path')

gulp.task('pre-test', function() {
  return gulp.src(path.join(__dirname, 'app/**/*.js'))
    .pipe(istanbul({
      includeUntested: true,
    }))
    .pipe(istanbul.hookRequire())
})

gulp.task('clean-cache', function(cb) {
  return gulp.src(path.join(__dirname, '.cdn-cache'), {read: false})
    .pipe(clean({force: true}))
})

gulp.task('test', ['clean-cache', 'pre-test'], function(cb) {
  let mochaErr

  gulp.src([path.join(__dirname, 'test/**/*.js'), '!**/local-pkg/**'])
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', err => mochaErr = err)
    .pipe(istanbul.writeReports())
    .on('end', () => cb(mochaErr))
})

gulp.task('coveralls', function() {
  return gulp.src(path.join(__dirname, 'coverage/**/lcov.info'))
    .pipe(coveralls())
})
