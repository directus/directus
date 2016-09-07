// Include gulp
var fs        = require('fs');
var cp        = require('child_process');
var gulp      = require('gulp');
var uglify    = require('gulp-uglify');
var mincss    = require('gulp-minify-css');
var concat    = require('gulp-concat');
var rename    = require('gulp-rename');
var sass      = require('gulp-sass');
var size      = require('gulp-size');
var rjs       = require('gulp-requirejs');
var prohtml   = require('gulp-processhtml');
var deploy    = require('gulp-gh-pages');
var merge     = require('merge-stream');
var jscs      = require('gulp-jscs');
var excludeGitignore = require('gulp-exclude-gitignore');


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
  return gulp.src(['assets/scss/compile.scss'])
    .pipe(sass())
    .pipe(rename('directus.css'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(gulp.dest('assets/css'))
    .pipe(size())
    .pipe(rename('directus.min.css'))
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

// Include what's neccesary
// @TODO: include all vendors
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
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(rename('vendor.min.js'))
    .pipe(size())
    .pipe(uglify())
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
    optimize: 'uglify2',
    wrap: true,
    paths: {

      // Libraries.
      "jquery":     "../assets/js/libs/jquery",
      "underscore": "../assets/js/libs/underscore",
      "backbone":   "../assets/js/libs/backbone",
      "handlebars": "../assets/js/libs/handlebars",
      "sortable":  "../assets/js/libs/sortable",
      "marked":    "../assets/js/libs/marked.min",
      "moment":     "../assets/js/libs/moment.min",
      "noty":     "../assets/js/libs/noty",
      "noty_theme": "../assets/js/libs/noty_theme",
      "polyglot":   "../assets/js/libs/polyglot.min",

      // JavaScript folders.
      "libs":       "../assets/js/libs",
      "plugins":    "../assets/js/plugins",
      "vendor":     "../assets/vendor",

      // Extensions
      "extensions": '../customs/extensions',
      "listviews":  '../customs/listviews',
      "uis":         '../customs/uis'
    },

    shim: {

      "backbone": {
        deps: ["underscore", "jquery"],
        exports: "Backbone"
      },

      "handlebars": {
        exports: "Handlebars"
      },

      "underscore": {
        exports: '_'
      },

      "noty": {
        deps: ["jquery"]
      },

      "noty_theme": {
        deps: ["jquery", "noty"]
      },

      "marked": {
        exports: 'marked'
      },

      "polyglot": {
        exports: 'Polyglot'
      },

      "plugins/jquery.flashrow": ['jquery'],

      "plugins/backbone.layoutmanager": ["backbone"],
      'plugins/backbone.trackit': ['backbone'],
      "plugins/bootstrap-dropdown": ["jquery"],
      "plugins/typeahead": ["jquery"],
      "plugins/bootstrap-tooltip": ["jquery"]
    }
  }))
    .pipe(gulp.dest('./dist/assets/js/')); // pipe it to the output DIR
});

// Concat vendors and application into one minified file
gulp.task('scripts:directus', function() {
  return gulp.src(['./dist/assets/js/vendor.js', './dist/assets/js/app.min.js'])
    .pipe(concat('directus.min.js'))
    .pipe(uglify())
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

var singlePageFiles = ['./main.html', './login.php'];
gulp.task('singlepage', function () {
  return gulp.src(singlePageFiles)
    .pipe(prohtml())
    .pipe(gulp.dest('dist'));
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
    './api/views/**/*',
    // './api/vendor/**/*.*',
    './composer.json',
    './api/.htaccess',
    './api/api.php',
    './api/config_sample.php',
    './api/configuration_sample.php',
    './api/globals.php',
    './api/ruckusing.conf.php',
    './api/schema.sql',
    // for login.php
    './assets/js/libs/jquery.js',
    './assets/js/libs/jquery.min.map',
    './assets/js/libs/wysihtml5.js',
    './assets/css/wysiwyg.css',
    './bin/**',
    //'./extensions/**',
    './installation/**',
    // These two directories are moved separately below
    //'./listviews/**',
    //'./media/**/*',
    //'./media_auth_proxy/**',
    //'./ui/**/*',
    './.htaccess',
    './favicon.ico',
    './index.php',
    // This two files are processed by singlepage task
    //'./login.php',
    //'./main.html',
    './readme.md'
  ];

  var dirsToKeep = [
    './customs/uis/.gitignore',
    './customs/endpoints/.htaccess',
    './customs/extensions/.htaccess',
    './customs/extensions/.gitignore',
    './storage/uploads/.htaccess',
    './storage/uploads/**/.gitignore',
    //'./media_auth_proxy/client_auth_proxies/.gitignore',
    './customs/listviews/.gitignore'
  ];

  var mainFiles = gulp.src(filesToMove, { base: './' })
    .pipe(excludeGitignore())
    .pipe(gulp.dest('dist'));

  var keepFiles = gulp.src(dirsToKeep, { base: './', dot: true })
    .pipe(gulp.dest('dist'));

  return merge(mainFiles, keepFiles);
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch('assets/scss/directus/**/*.scss', ['styles']);
  gulp.watch('app/**/*.js', ['scripts:app', 'scripts:directus']);
  gulp.watch(vendorFiles, ['scripts:vendor', 'scripts:directus']);
  gulp.watch('assets/fonts/**/*.*', ['fonts']);
  gulp.watch('assets/img/**/*.*', ['images']);
  gulp.watch('app/**/*.html', ['templates']);
  gulp.watch(singlePageFiles, ['singlepage']);
});

gulp.task('deploy', function() {
  return gulp.src(['./dist/**/*'], {dot: true})
        .pipe(deploy({branch: 'build', remoteUrl:'https://github.com/directus/directus'}));
});

gulp.task('jscs', function() {
  return gulp.src('app/**/*.js')
    .pipe(jscs());
});

// -------------------
// Build - Gulp Task
// Run all the tasks
// ------------------- 'composer',
gulp.task('build', function(cb) {
    runSequence(['scripts', 'templates', 'singlepage', 'styles', 'fonts', 'images', 'submodules', 'move', 'composer', 'clean-git', cb]);
});

// Default task
gulp.task('default', ['watch', 'build']);
