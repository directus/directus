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

window.directusData = {
  locale: 'en'
};

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base/app',

  // dynamically load all test files
  deps: allTestFiles,

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

    // Extensions
    extensions: '../customs/extensions',
    listviews: '../customs/listviews',
    interfaces: '../customs/interfaces',
    uis: '../customs/interfaces'
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
  },

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
