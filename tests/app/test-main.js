var TEST_REGEXP = /(Spec|Test)\.js$/;

// Get a list of all the test files to include
var allTestFiles = Object.keys(window.__karma__.files).filter(function (file) {
  return TEST_REGEXP.test(file);
});

function defaultAppOptions(app) {
  app.statusMapping = {
    status_name: 'active',
  };

  return app;
}

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base/app',

  // dynamically load all test files
  deps: allTestFiles,

  paths: {

    // Libraries.
    "jquery":     "../assets/js/libs/jquery",
    "underscore": "../assets/js/libs/underscore",
    "backbone":   "../assets/js/libs/backbone",
    "handlebars": "../assets/js/libs/handlebars",
    "sortable":  "../assets/js/libs/sortable",
    "moment":     "../assets/js/libs/moment.min",
    "noty":     "../assets/js/libs/noty",
    "noty_theme": "../assets/js/libs/noty_theme",

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

    "plugins/jquery.flashrow": ['jquery'],

    "plugins/backbone.layoutmanager": ["backbone"],
    "plugins/bootstrap-dropdown": ["jquery"],
    "plugins/typeahead": ["jquery"],
    "plugins/bootstrap-tooltip": ["jquery"]
  },

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
