define(function(require, exports, module) {

  "use strict";

  var Backbone = require('backbone'),
      ColumnModel = require('./ColumnModel');

  module.exports = Backbone.Collection.extend({

    model: ColumnModel,

    comparator: function(row) {
      return row.get('sort');
    },

    parse: function(result, options) {
      return options.xhr ? result.data : result;
    },

    getRelationalColumns: function() {
      return this.filter(function(column) {
        return column.hasRelated();
      });
    },

    getColumnsByType: function(type) {
      type = type.toLowerCase();
      return this.filter(function(column) {
        return column.get('type').toLowerCase() === type;
      });
    },

    save: function(attributes, options) {
      options = options || {};
      var collection = this;
      var success = options.success;

      options.success = function(model, resp, xhr) {
        collection.reset(model);
        if (success !== undefined) {
          success();
        }
      };

      return Backbone.sync('update', this, options);
    },

    initialize: function() {
    }

  });

});
