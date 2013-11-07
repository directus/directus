define(function(require, exports, module) {

  "use strict";

  _ = require('underscore');

  var ExtensionsManager = function Extensions() {
    console.log('extensions begin');
  };

  _.extend(ExtensionsManager.prototype, {

    register: function(extensions) {
      _.each(extensions, function(extension) {
        this._extensions[extension.id] = extension;
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
    }

  });

/*  Extensions.prototype.register = function(sources) {
    this.external = sources;
  };

  Extensions.prototype.get = function(id, callback) {
    var path = this.external[id];

    var errback = function(err) {
      callback(err);
    };

    require([path], function(module) {
      callback(null, module);
    }, errback);

  };
*/

  module.exports = ExtensionsManager;

});