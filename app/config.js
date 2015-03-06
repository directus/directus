require.config({

  urlArgs: 'bust=' + window.directusData.cacheBuster,

  //deps: ["main"],

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
  }

});
