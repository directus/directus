// Include gulp
var fs      = require('fs');
var cp      = require('child_process');
var gulp    = require('gulp');
var uglify  = require('gulp-uglify');
var mincss  = require('gulp-minify-css');
var concat  = require('gulp-concat');
var rename  = require('gulp-rename');
var less    = require('gulp-less');
var size    = require('gulp-size');
var rjs     = require('gulp-requirejs');
var gulpSync= require('gulp-sync')(gulp);

// --------------------
// CSS - Gulp Task
// --------------------
gulp.task('styles', function() {
  return gulp.src(['assets/less/directus/directus.less'])
    .pipe(less())
    .pipe(rename('directus.css'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(size())
    .pipe(rename('directus.min.css'))
    .pipe(mincss())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(size())
});

// --------------------
// JS - Gulp Task
// --------------------
gulp.task('scripts', ['scripts:app', 'scripts:vendor', 'scripts:directus']);

// Concat all vendors
gulp.task('scripts:vendor', function() {
  // Include what's neccesary
  // @TODO: include all vendors
  var vendorFiles = [
    'assets/js/libs/handlebars.js',
    //'assets/js/libs/bootstrap.js',
    'assets/js/libs/require.js',
    'assets/js/util/*.js'
  ];

  return gulp.src(vendorFiles)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(rename('vendor.min.js'))
    .pipe(size())
    //.pipe(uglify())
    .pipe(size())
    .pipe(gulp.dest('dist/assets/js'));
});

// Concat all application scripts
gulp.task('scripts:app', function() {
  return rjs(({
    mainConfigFile : "app/main.js",
    baseUrl : "app",
    name: "main",
    out: "app.min.js",
    removeCombined: true,
    findNestedDependencies: true,
    optimize:'',// 'uglify2',
    wrap: true,
    paths: {

      // Libraries.
      'jquery': '../assets/js/libs/jquery',
      'underscore': '../assets/js/libs/underscore',
      'handlebars': 'empty:',
      'backbone': '../assets/js/libs/backbone',
      'moment': '../assets/js/libs/moment.min',
      'noty': '../assets/js/libs/noty',
      'noty_theme' : "../assets/js/libs/noty_theme",
      'sortable': '../assets/js/libs/sortable',

      // JavaScript folders.
      "libs":       "../assets/js/libs",
      "plugins":    "../assets/js/plugins",
      "vendor":     "../assets/vendor",

      // Extensions
      "extensions": '../extensions',
      "listviews":  '../listviews',
      "ui":         '../ui'
    },

    shim: {
      'underscore': {
        exports: '_'
      },
      'backbone': {
        deps: [
          'underscore',
          'jquery'
        ],
        exports: 'Backbone'
      },
      'bootstrap': {
        deps: [
          'jquery'
        ]
      },
      'noty': {
        deps: [
          'jquery'
        ]
      },
      "noty_theme": {
        deps: [
          "jquery",
          "noty"
        ]
      },
      "plugins/backbone.layoutmanager": {
        deps: [
          "backbone"
        ]
      },
      "plugins/bootstrap-dropdown": {
        deps: [
          "jquery"
        ],
      },
      'plugins/typeahead': {
        deps: [
          'jquery'
        ]
      },
      "plugins/bootstrap-tooltip": {
        deps:[
          "jquery"
        ]
      }
    }
  }))
    .pipe(gulp.dest('./dist/assets/js/')); // pipe it to the output DIR
});

// Concat vendors and application into one minified file
gulp.task('scripts:directus', function() {
  return gulp.src(['./dist/assets/js/vendor.js', './dist/assets/js/app.min.js'])
    .pipe(concat('directus.min.js'))
    //.pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'));
});

// --------------------
// Assets - Gulp Task
// Other fonts, images
// --------------------
gulp.task('fonts', function() {
  return gulp.src('assets/fonts/**/*.*')
    .pipe(gulp.dest('dist/assets/fonts/'));
});
gulp.task('images', function() {
  return gulp.src('assets/img/**/*.*')
    .pipe(gulp.dest('dist/assets/img/'));
});

// --------------------
// HTML - Gulp Task
// Templates
// --------------------
gulp.task('templates', function() {
  return gulp.src('app/**/*.html')
    .pipe(gulp.dest('dist/app/'));
});

// --------------------
// Media - Gulp Task
// Creates media dir
// --------------------
gulp.task('media', function(cb) {
  var exec = cp.exec;
  exec('mkdir -p media/thumbs; mkdir -p media/temp', function(err, stdout, stderr){
    if (err !== null) {
      console.log('exec error: ', err);
    }
    cb();
  })
});

// --------------------
// Composer - Gulp Task
// --------------------
gulp.task('composer', function(cb) {
  var child = cp.spawn('composer', ['install', '--ansi'], {cwd: './api'});

  child.stdout.on('data', function(chunk) {
    process.stdout.write(chunk);
  });
  child.on('close', function(){
    cb();
  });
});

// -------------------
// Move - Gulp Task
// Move required files
// -------------------

gulp.task('move', function() {
  var filesToMove = [
    './api/core/**',
    './api/logs/**',
    './api/vendor/**',
    './api/.htaccess',
    './api/!(composer.json|composer.lock|config.php|configuration.php|schema.sql)',
    // for login.php
    // @TODO: find a better way
    './assets/js/libs/jquery.js',
    './assets/js/libs/wysihtml5.js',
    './assets/css/wysiwyg.css',
    './bin/**',
    './extensions/**',
    './installation/**',
    './listviews/**',
    './media/**',
    './media_auth_proxy/**',
    './ui/**',
    './.htaccess',
    './favicon.ico',
    './index.php',
    './login.php',
    './main.html',
    './readme.md'
  ];

  return gulp.src(filesToMove, { base: './' })
    .pipe(gulp.dest('dist'));
});

// -------------------
// Build - Gulp Task
// Run all the tasks
// ------------------- 'composer',
gulp.task('build', ['scripts', 'templates', 'styles', 'fonts', 'images', 'media', 'move']);

// Default task
gulp.task('default', ['build']);