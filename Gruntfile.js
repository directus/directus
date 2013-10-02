/*
Notes:

Example file for r.js build
https://github.com/jrburke/r.js/blob/master/build/example.build.js

grunt-contrib-requirejs
https://npmjs.org/package/grunt-contrib-requirejs
*/

module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        clean: ["dist/"],

        // uglify: {
        //     options: {
        //         banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        //     }
        // },
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

                optimize: "none",

                paths: {
                    requireLib: '../assets/js/libs/require'
                },
                name: 'main',
                include: ["requireLib"]

                // name: "almond",
                // include: ["main"]
            }
          }
        }

    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks("grunt-contrib-handlebars");
    grunt.loadNpmTasks("grunt-contrib-concat");

    grunt.registerTask('default', [
        'clean',
        'handlebars',
        'requirejs',
        'concat'
    ]);
}