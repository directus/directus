define(function(require, exports, module) {

  "use strict";

  var Backbone = require('backbone'),
      ColumnsCollection = require('./ColumnsCollection');

  module.exports =  Backbone.Model.extend({

    parse: function(data) {
      if (this.columns === undefined) {
        this.columns = new ColumnsCollection(data.columns, {parse: true, url: this.url + '/columns'});
      } else {
        this.columns.reset(data.columns, {parse: true});
      }
      
      this.columns.table = this;

      return _.omit(data, 'columns');
    },

    toJSON: function(options) {
      var attrs = _.clone(this.attributes);
      attrs.columns = this.columns.toJSON();
      return attrs;
    }

  });

});