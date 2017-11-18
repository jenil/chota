'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var rename = require('gulp-rename')
var autoprefixer = require('gulp-autoprefixer')
var minCss = require('gulp-minify-css')

gulp.task('sass', function () {
  return gulp.src('./src_sass/**/*.scss')
    .pipe(sass({
            outputStyle : 'expanded'
        }).on('error', sass.logError))
    .pipe(autoprefixer({ browsers: "last 2 versions" }))
    .pipe(gulp.dest('./dist'))
    .pipe(minCss())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./dist'));
});
 
gulp.task('sass:watch', function () {
  gulp.watch('./src_sass/**/*.scss', ['sass']);
});