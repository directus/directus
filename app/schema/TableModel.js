define(function(require, exports, module) {

  "use strict";

  var Backbone = require('backbone'),
      ColumnsCollection = require('./ColumnsCollection');

  module.exports =  Backbone.Model.extend({

    parse: function(data) {
      if (this.columns === undefined) {
        this.columns = new ColumnsCollection(data.columns, {parse: true});
      } else {
        this.columns.reset(data.columns, {parse: true});
      }
      delete data.columns;
      return data;
    },

    toJSON: function(options) {
      var attrs = _.clone(this.attributes);
      attrs.columns = this.columns.toJSON();
      return attrs;
    }

  });

});