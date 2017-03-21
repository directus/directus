define(function(require, exports, module) {

  "use strict";

  var _        = require('underscore'),
      jQuery   = require('jquery');

  // Private
  var extensions = {};

  module.exports = {

    register: function(ext) {
      _.each(ext, function(extension) {
        extension.path = 'ext/' + encodeURIComponent(extension.id);
        extensions[extension.id] = extension;
      },this);
    },

    load: function(paths) {
      var self = this;
      var dfd = new jQuery.Deferred();

      require(paths, function() {
        self.register(_.values(arguments));
        dfd.resolve();
      });

      return dfd;
    },

    getInstance: function(id) {
      return new extensions[id].Router('ext/' + id);
    },

    getIds: function() {
      return _.keys(extensions);
    },

    getInfo: function(id) {
      return extensions[id];
    }

  };

});
