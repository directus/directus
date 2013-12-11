/*
Notes:

Example file for r.js build
https://github.com/jrburke/r.js/blob/master/build/example.build.js

grunt-contrib-requirejs
https://npmjs.org/package/grunt-contrib-requirejs
*/

module.exports = function(grunt) {

    'use strict';

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
            predef: ['$', '_', 'Backbone', 'File', 'Handlebars', 'require']
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
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks("grunt-contrib-handlebars");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-karma-coveralls");

    grunt.registerTask('default', [
        'clean',
        'jshint',
        'handlebars',
        'requirejs',
        'concat'
    ]);
}