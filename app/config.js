//  config.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file.
  deps: ["main"],

  //urlArgs: "bust=" + (new Date()).getTime(),    //FOR CACHE BUSTING DURING DEV
  paths: {
    // JavaScript folders.
    libs: "../assets/js/libs",
    plugins: "../assets/js/plugins",
    vendor: "../assets/vendor",

    // Libraries.
    jquery: "../assets/js/libs/jquery",
    underscore: "../assets/js/libs/underscore",
    backbone: "../assets/js/libs/backbone",
    handlebars: "../assets/js/libs/handlebars",

    // Extensions
    extensions: '../extensions',
    ui: '../ui',

    //both of these should obviously not be included:
    "jquery-ui": "../assets/js/libs/jquery-ui"
  },

  shim: {
    // Backbone library depends on lodash and jQuery.
    backbone: {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    "jquery-ui": {
      deps: ['jquery']
    },

    /*bootstrap: {
      deps: ["jquery"]
    },*/
    // Handlebars has no dependencies.
    handlebars: {
      exports: "Handlebars"
    },
    underscore: {
      exports: '_'
    },
    // LayoutManager and Paginator depends on Backbone.
    "plugins/jquery.timeago": ["jquery"],
    "plugins/backbone.layoutmanager": ["backbone"],
    "plugins/bootstrap-dropdown": ["jquery"],
    "plugins/bootstrap-typeahead": ["jquery"],
    "plugins/bootstrap-tooltip": ["jquery"]
  }
});
