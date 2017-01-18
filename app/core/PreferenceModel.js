define(function(require, exports, module) {

  "use strict";

  var Backbone                = require("backbone");

  var PreferenceModel = module.exports = Backbone.Model.extend({
      parse: function(data) {
        return data.meta ? data.data : data;
      },

      fetch: function(options) {
        this.trigger('fetch', this);
        var args = {
          data: $.param(options)
        };
        this.constructor.__super__.fetch.call(this, args);
      }
  });

});
