/*
Notes:

Example file for r.js build
https://github.com/jrburke/r.js/blob/master/build/example.build.js

grunt-contrib-requirejs
https://npmjs.org/package/grunt-contrib-requirejs
*/
'use strict';

module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);
    
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        clean: ["dist/"],

        jshint: {
          options: {
            devel: true,
            browser: true,
            scripturl: true,
            multistr: true,
            onecase: true,
            sub: true,
            globals: {
              '$': true,
              '_': true,
              'Backbone': true,
              'File': true,
              'Handlebars': true,
              'require': true
            },
            'reporter': require('jshint-stylish')
          },
          all: ['app/**/*.js']
        },

        concat: {
            dist: {
              src: ['dist/app.js','dist/templates.js'],
              dest: 'dist/release.js'
            },
            separator: ";"
        },

        handlebars: {
          compile: {
            options: {
              namespace: "JST"
            },
            files: {
              "dist/templates.js": "app/templates/*.html"
            }
          }
        },

        requirejs: {
          release: {
            options: {
                //appDir: "build-test/",
                baseUrl: "app",
                mainConfigFile: 'app/config.js',
                out: 'dist/app.js',

                findNestedDependencies: true,

                optimize: "uglify2",

                paths: {
                    requireLib: '../assets/js/libs/require'
                },
                name: 'main',
                include: ['requireLib']

                // name: "almond",
                // include: ["main"]
            }
          }
        },

        karma: {
          options: {
            basePath: process.cwd(),
            singleRun: true,
            captureTimeout: 7000,
            autoWatch: true,
            logLevel: "ERROR",

            reporters: ["dots", "coverage"],
            browsers: ["PhantomJS"],

            // Change this to the framework you want to use.
            frameworks: ["mocha"],

            plugins: [
              "karma-jasmine",
              "karma-mocha",
              "karma-qunit",
              "karma-phantomjs-launcher",
              "karma-coverage"
            ],

            preprocessors: {
              "app/**/*.js": "coverage"
            },

            coverageReporter: {
              type: "lcov",
              dir: "test/coverage"
            },

            files: [
              // You can optionally remove this or swap out for a different expect.
              "assets/bower/chai/chai.js",
              "assets/bower/requirejs/require.js",
              "test/runner.js",

              { pattern: "app/**/*.*", included: false },
              // Derives test framework from Karma configuration.
              {
                pattern: "test/<%= karma.options.frameworks[0] %>/**/*.spec.js",
                included: false
              },
              { pattern: "vendor/**/*.js", included: false }
            ]
          },

          // This creates a server that will automatically run your tests when you
          // save a file and display results in the terminal.
          daemon: {
            options: {
              singleRun: false
            }
          },

          // This is useful for running the tests just once.
          run: {
            options: {
              singleRun: true
            }
          }
        },
        less: {
          options: {
            compress: false,
            sourceMap: false,
            sourceMapFilename: 'public/assets/css/main.css.map',
            sourceMapRootpath: '/directus-six-dax/'
          },
          development: {
            files: {
              'assets/css/directus.css' : 'assets/less/directus/_compile.less'
            }
          }
        },
        watch: {
          lesssrc: {
            files: ['assets/less/directus/**/*.less'],
            tasks: ['less']
          },
          alljs: {
            files: '<%= jshint.all %>',
            tasks: [ 'jshint' ]
          }
        }
    });

    grunt.registerTask('default', [
        'clean',
        'jshint',
        'handlebars',
        //'requirejs',
        'concat',
        'less'
    ]);
    
    grunt.registerTask('auto', [
        'default',
        'watch'
    ]);
}