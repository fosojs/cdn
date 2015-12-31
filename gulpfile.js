'use strict';

const gulp = require('gulp');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const plumber = require('gulp-plumber');

gulp.task('pre-test', function() {
  return gulp.src('app/**/*.js')
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function(cb) {
  let mochaErr;

  gulp.src(['test/**/*.js', '!**/local-pkg/**'])
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', (err) => mochaErr = err)
    .pipe(istanbul.writeReports())
    .on('end', () => cb(mochaErr));
});
