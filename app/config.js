require.config({

  deps: ["main"],

  paths: {

    // Libraries.
    "jquery":     "../assets/js/libs/jquery",
    "underscore": "../assets/js/libs/underscore",
    "backbone":   "../assets/js/libs/backbone",
    "handlebars": "../assets/js/libs/handlebars",
    "jquery-ui":  "../assets/js/libs/jquery-ui",
    "almond":     "../assets/js/libs/almond",

    // JavaScript folders.
    "libs":       "../assets/js/libs",
    "plugins":    "../assets/js/plugins",
    "vendor":     "../assets/vendor",

    // Extensions
    "extensions": "../extensions",
    "ui": '../ui'
  },

  shim: {

    "backbone": {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },

    "jquery-ui": {
      deps: ['jquery']
    },

    "handlebars": {
      exports: "Handlebars"
    },

    "underscore": {
      exports: '_'
    },

    "plugins/jquery.timeago": ["jquery"],
    "plugins/backbone.layoutmanager": ["backbone"],
    "plugins/bootstrap-dropdown": ["jquery"],
    "plugins/bootstrap-typeahead": ["jquery"],
    "plugins/bootstrap-tooltip": ["jquery"]
  }

});
