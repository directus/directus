define(function(require, exports, module) {

  "use strict";

  var Backbone = require('backbone');

  module.exports = Backbone.Model.extend({

    url: function() {
      var column = this.parent;
      var columnSchema = this.parent.collection;

      return this.parent.collection.url + '/' + this.parent.id + '/' + this.id;
    },

    // When the time is right, this part need serious reconsideration
    getStructure: function() {
      return this.parent.structure;
    },

    getTable: function() {
      return this.parent.getTable();
    },

    //@todo: This is code repetition. Almost identical to entries.model. Create a mixin?
    validate: function(attributes, options) {
      var errors = [];
      //var structure = this.getStructure();

      //only validates attributes that are part of the schema
      //attributes = _.pick(attributes, structure.pluck('id'));

      /*
      @todo: Fix this. Validation does not work!
      _.each(attributes, function(value, key, list) {
        var mess = ui.validate(this, key, value);
        if (mess !== undefined) {
          errors.push({attr: key, message: ui.validate(this, key, value)});
        }
      }, this);
      */
      if (errors.length > 0) return errors;
    }

  });

});