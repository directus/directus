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
    "marked":    "../assets/js/libs/marked.min",
    "moment":     "../assets/js/libs/moment.min",
    "moment-tz": "../assets/js/libs/moment-timezone-with-data.min",
    "noty":     "../assets/js/libs/noty",
    "noty_theme": "../assets/js/libs/noty_theme",
    "polyglot":   "../assets/js/libs/polyglot.min",
    "dragula": "../assets/js/vendor/dragula.min",
    "chart": "../assets/js/vendor/chart.min",
    "async": "../assets/js/plugins/async",

    // JavaScript folders.
    "libs":       "../assets/js/libs",
    "plugins":    "../assets/js/plugins",
    "vendor":     "../assets/vendor",

    // Extensions
    "extensions": '../customs/extensions',
    "listviews":  '../customs/listviews',
    "interfaces":  '../customs/interfaces',
    "uis":         '../customs/interfaces'
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

    "dragula": {
      exports: "Dragula"
    },

    "chart": {
      exports: "Chart"
    },

    "plugins/jquery.flashrow": ['jquery'],

    "moment-tz": ['moment'],

    "plugins/backbone.layoutmanager": ["backbone"],
    'plugins/backbone.trackit': ['backbone'],
    "plugins/bootstrap-dropdown": ["jquery"],
    "plugins/typeahead": ["jquery"],
    "plugins/bootstrap-tooltip": ["jquery"]
  }

});
