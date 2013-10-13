define([
  "app",
  "backbone",
  "core/collection.columns"
],

function(app, Backbone, Structure) {

  "use strict";

  var Model =  Backbone.Model.extend({

    parse: function(data) {
      if (this.columns === undefined) {
        this.columns = new Structure.Columns(data.columns, {parse: true});
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

  return Model;
});