// Include gulp
var fs        = require('fs');
var cp        = require('child_process');
var gulp      = require('gulp');
var flatten   = require('gulp-flatten');
var archiver  = require('gulp-archiver');
var uglify    = require('gulp-uglify');
var mincss    = require('gulp-minify-css');
var concat    = require('gulp-concat');
var gzip      = require('gulp-gzip');
var rename    = require('gulp-rename');
var sass      = require('gulp-sass');
var size      = require('gulp-size');
var rjs       = require('gulp-requirejs');
var prohtml   = require('gulp-processhtml');
var deploy    = require('gulp-gh-pages');
var merge     = require('merge-stream');
var excludeGitignore = require('gulp-exclude-gitignore');
var moment    = require('moment');
var pac       = require('./package.json');
var datetime  = moment().format('YYYYMMDDHHmmss');


// ----------------------------
// Run sequence shell commands
// ----------------------------
function runSequence(commands, prefix) {
  var exec = cp.exec,
      commands = (typeof commands === "string") ? commands.split(',') : commands,
      prefix = prefix || 'gulp ';

  var commandsList = commands;
  // Run Next Command on the command list
  function executeCommand() {
    if(commandsList.length > 0) {
      var command = commandsList.shift(),
          cmd = prefix + command + ' --ansi',
          out = [];

      if(typeof command === "string") {
        exec(cmd, function(error, stdout, stderr) {
          executeCommand();
        }).stdout.on('data', function (chunk) {
          out.push(chunk);
        }).on('close', function() {
          console.log(out.join(''));
        });
      } else {
        executeCommand();
      }
    }
  }

  executeCommand();
}

// --------------------
// CSS - Gulp Task
// --------------------
gulp.task('styles', function() {
  return gulp.src(['assets/sass/main.scss'])
    .pipe(sass())
    .pipe(rename('main.css'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(gulp.dest('assets/css'))
    .pipe(size())
    .pipe(rename('main.min.css'))
    .pipe(mincss())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(size())
});

// --------------------
// JS - Gulp Task
// --------------------
gulp.task('scripts', function(cb) {
  runSequence(['scripts:app', cb, 'scripts:vendor', 'scripts:directus']);
});

// Include what's necessary
// TODO: include all vendors
var vendorFiles = [
  'assets/js/libs/handlebars.js',
  //'assets/js/libs/bootstrap.js',
  'assets/js/libs/require.js',
  'assets/js/util/*.js'
];

// Concat all vendors
gulp.task('scripts:vendor', function() {
  return gulp.src(vendorFiles)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('./dist/app'));
});

// Concat all application scripts
gulp.task('scripts:app', function() {
  return rjs(({
    mainConfigFile : 'app/main.js',
    generateSourceMaps: true,
    baseUrl : 'app',
    name: 'main',
    out: 'app.js',
    removeCombined: true,
    findNestedDependencies: true,
    optimize: 'uglify2',
    wrap: true,
    paths: {

      // Libraries.
      jquery: '../assets/js/libs/jquery',
      underscore: '../assets/js/libs/underscore',
      backbone: '../assets/js/libs/backbone',
      handlebars: '../assets/js/libs/handlebars',
      sortable: '../assets/js/libs/sortable',
      marked: '../assets/js/libs/marked.min',
      moment: '../assets/js/libs/moment.min',
      'moment-tz': '../assets/js/libs/moment-timezone-with-data.min',
      noty: '../assets/js/libs/noty',
      noty_theme: '../assets/js/libs/noty_theme',
      polyglot: '../assets/js/libs/polyglot.min',
      dragula: '../assets/js/vendor/dragula.min',
      chart: '../assets/js/vendor/chart.min',
      select2: '../assets/js/vendor/select2.min',
      async: '../assets/js/plugins/async',
      tinyMCE: '../assets/js/vendor/tinymce/tinymce.min',

      // JavaScript folders.
      libs: '../assets/js/libs',
      plugins: '../assets/js/plugins',
      vendor: '../assets/vendor',

      // Customs paths
      // extensions: 'customs/extensions',
      // listviews: 'customs/listviews',
      // interfaces: 'customs/interfaces',
      // uis: 'customs/interfaces'
    },

    shim: {

      backbone: {
        deps: ['underscore', 'jquery'],
        exports: 'Backbone'
      },

      handlebars: {
        exports: 'Handlebars'
      },

      underscore: {
        exports: '_'
      },

      noty: {
        deps: ['jquery']
      },

      noty_theme: {
        deps: ['jquery', 'noty']
      },

      marked: {
        exports: 'marked'
      },

      polyglot: {
        exports: 'Polyglot'
      },

      dragula: {
        exports: 'Dragula'
      },

      chart: {
        exports: 'Chart'
      },

      select2: {
        deps: ['jquery'],
        exports: '$.fn.select2'
      },

      tinyMCE: {
        exports: 'tinyMCE',
        init: function () {
          this.tinyMCE.DOM.events.domLoaded = true;
          return this.tinyMCE;
        }
      },

      // TODO: Re-implement flash row, nice and clean
      'plugins/jquery.flashrow': ['jquery'],

      'moment-tz': ['moment'],

      'plugins/backbone.layoutmanager': ['backbone'],
      'plugins/backbone.trackit': ['backbone'],
      'plugins/backbone.stickit': ['backbone'],
      'plugins/bootstrap-dropdown': ['jquery'],
      'plugins/typeahead': ['jquery'],
      'plugins/bootstrap-tooltip': ['jquery']
    }
  }))
    .pipe(gulp.dest('./dist/app/')); // pipe it to the output DIR
});

// Concat vendors and application into one minified file
gulp.task('scripts:directus', function() {
  return gulp.src(['./dist/app/vendor.js', './dist/app/app.js'])
    .pipe(concat('directus.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/app/'));
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
  return gulp.src('app/**/*.handlebars')
    .pipe(gulp.dest('dist/app/'));
});

var singlePageFiles = ['./templates/base.twig'];
gulp.task('singlepage', function () {
  return gulp.src(singlePageFiles)
    .pipe(prohtml())
    .pipe(gulp.dest('dist/templates'));
});

function getZippedFilename() {
  var name = 'directus-build';
  var version = pac.version;

  return [name, version, datetime].join('-');
}

function allFiles(prefix) {
  return ['**/*', '**/.*', '.**/*', '.**/.*'].map(function (path) {
    return prefix + path;
  });
}

gulp.task('zipit', function () {
  var filename = getZippedFilename();

  return gulp.src(allFiles('dist/'))
    .pipe(archiver(filename + '.zip'))
    .pipe(gulp.dest('./'))
});

gulp.task('tarit', function () {
  var filename = getZippedFilename();

  return gulp.src(allFiles('dist/'))
    .pipe(archiver(filename + '.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('./'))
});

function executeCommand(cb, opts) {
  var command = opts.command;
  var args = opts.args;
  var options = opts.options;
  var child = cp.spawn(command, args, options);

  child.stdout.on('data', function(chunk) {
    process.stdout.write(chunk);
  });
  child.on('close', function(){
    cb();
  });
}

// --------------------
// Composer - Gulp Task
// --------------------
gulp.task('composer', function(cb) {
  executeCommand(cb, {
    command: 'composer',
    args: ['install', '--ansi', '--prefer-dist', '--no-dev'],
    options: {cwd: './dist/'}
  });
});

// --------------------
// Remove all .git inside the vendor - Gulp Task
// Avoiding all posibles repositories being marked as submodule
// --------------------
gulp.task('clean-git', function(cb) {
  cp.exec('find ./dist/vendor | grep .git | xargs rm -rf', function() {
    cb()
  });
});

// --------------------
// Git Sub-modules- Gulp Task
// --------------------
gulp.task('submodules', function(cb) {
  executeCommand(cb, {
    command: 'git',
    args: ['submodule', 'update', '--init', 'api/migrations/templates'],
    options: {cwd: './'}
  });
});

// -------------------
// Move - Gulp Task
// Move required files
// -------------------
gulp.task('move', function() {
  var filesToMove = [
    './api/core/**',
    './api/logs/*',
    './api/locales/*.json',
    './api/migrations/**/*',
    './api/routes/**/*',
    './api/views/**/*',
    // './api/vendor/**/*.*',
    './composer.json',
    './api/.htaccess',
    './api/api.php',
    './api/config_sample.php',
    './api/configuration_sample.php',
    './api/ruckusing.conf.php',
    './api/schema.sql',
    './assets/css/**/*',
    './assets/imgs/**/*',
    // for login.php
    './assets/js/libs/jquery.js',
    './assets/js/libs/jquery.min.map',
    './bin/**',
    //'./extensions/**',
    './installation/**',
    './templates/**',
    // These two directories are moved separately below
    //'./listviews/**',
    //'./media/**/*',
    //'./media_auth_proxy/**',
    //'./ui/**/*',
    './.htaccess',
    './favicon.ico',
    './index.php',
    './login.php',
    // This two files are processed by singlepage task
    //'./login.php',
    //'./main.html',
    './readme.md'
  ];

  var dirsToKeep = [
    './customs/interfaces/.gitignore',
    './customs/endpoints/.htaccess',
    './customs/endpoints/_example.php',
    './customs/extensions/.htaccess',
    './customs/extensions/.gitignore',
    './customs/extensions/_example/**/*',
    './customs/hashers/_CustomHasher.php',
    './customs/hooks/BeforeInsertProducts.php',
    './customs/interfaces/_example/**/*',
    './customs/interfaces/rating/**/*',
    './storage/uploads/.htaccess',
    './storage/uploads/**/.gitignore',
    './storage/uploads/00000000001.jpg',
    './storage/uploads/thumbs/1.jpg',
    //'./media_auth_proxy/client_auth_proxies/.gitignore',
    './customs/listviews/.gitignore',
    './thumbnail/*'
  ];

  var mainFiles = gulp.src(filesToMove, { base: './' })
    .pipe(excludeGitignore())
    .pipe(gulp.dest('dist'));

  var keepFiles = gulp.src(dirsToKeep, { base: './', dot: true })
    .pipe(gulp.dest('dist'));

  var tinyMCEFiles = gulp.src([
      './assets/js/vendor/tinymce/**/*',
      '!./assets/js/vendor/tinymce/*'
    ])
    .pipe(flatten({includeParents: 99}))
    .pipe(gulp.dest('./dist/app'));

  return merge(mainFiles, keepFiles, tinyMCEFiles);
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch('assets/sass/**/*.scss', ['styles']);
  gulp.watch('app/**/*.js', ['scripts:app', 'scripts:directus']);
  gulp.watch(vendorFiles, ['scripts:vendor', 'scripts:directus']);
  gulp.watch('assets/fonts/**/*.*', ['fonts']);
  gulp.watch('assets/img/**/*.*', ['images']);
  gulp.watch('app/**/*.handlebars', ['templates']);
  gulp.watch(singlePageFiles, ['singlepage']);
});

gulp.task('deploy', function() {
  // force = true, to include all files avoiding .gitignore
  return gulp.src(['./dist/**/*'], {dot: true})
        .pipe(deploy({branch: 'build', force: true, remoteUrl:'https://github.com/directus/directus'}));
});

// -------------------
// Build - Gulp Task
// Run all the tasks
// ------------------- 'composer',
gulp.task('build', function(cb) {
    runSequence([
      'scripts',
      'templates',
      'styles',
      'fonts',
      'images',
      'submodules',
      'move',
      'singlepage',
      'composer',
      'clean-git',
      'zipit',
      'tarit',
      cb
    ]);
});

// Default task
gulp.task('default', ['watch', 'build']);
