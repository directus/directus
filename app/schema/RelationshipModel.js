define(function(require, exports, module) {
  'use strict';

  var Backbone = require('backbone');

  module.exports = Backbone.Model.extend({
    parse: function(data) {
      data.type = data.relationship_type;

      return data;
    }
  });

});
