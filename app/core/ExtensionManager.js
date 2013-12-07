define(function(require, exports, module) {

  "use strict";

  var _ = require('underscore');

  // Private
  var extensions = {};

  module.exports = {

    register: function(ext) {
      _.each(ext, function(extension) {
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
      var extension = new extensions[id].Router(id);

      return extension;
    },

    getIds: function() {
      return _.keys(extensions);
    }

  };

});