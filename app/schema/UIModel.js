define(function(require, exports, module) {
  'use strict';

  var app = require('app');
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Utils = require('utils');

  module.exports = Backbone.Model.extend({

    inputs: {},

    addInput: function(attr, input) {
      this.inputs[attr] = input;
    },

    getInput: function(attr) {
      return this.inputs[attr];
    },

    parse: function(data) {
      return data.data;
    },

    url: function() {
      var column = this.parent;
      var columnSchema = this.parent.collection;

      return columnSchema.url + '/' + column.id + '/' + this.id;
    },

    // When the time is right, this part need serious reconsideration
    getStructure: function() {
      return this.structure;
    },

    getTable: function() {
      return this.parent.getTable();
    },

    //@todo: This is code repetition. Almost identical to entries.model. Create a mixin?
    validate: function(attributes, options) {
      var errors = [];
      var structure = this.getStructure();

      // When this model is created the structure may not be defined.
      if (!structure) {
        return;
      }

      // only validates attributes that are part of the schema
      attributes = _.pick(attributes, structure.pluck('id'));
      _.each(attributes, function(value, key, list) {
        var column = structure.get(key);

        // Don't validate hidden fields
        // @todo should this be adjusted since these fields are now posting in some cases?
        if (column.get('hidden_input')) {
          return;
        }

        // Don't validate ID
        if (key === 'id') {
          return;
        }

        if (column.get('default_value') !== undefined) {
          return;
        }

        // UIModel is being define before UIManager
        // @TODO: Fix this
        var UIManager = require('core/UIManager');

        var nullDisallowed = column.get('is_nullable') === 'NO';
        var ui = UIManager._getInterface(column.get('ui'));
        var forceUIValidation = ui.forceUIValidation === true;
        var isNull = Utils.isNothing(value);
        var uiSettings = UIManager.getSettings(column.get('ui'));
        var skipSerializationIfNull = uiSettings.skipSerializationIfNull;
        var mess = (!forceUIValidation && !skipSerializationIfNull && nullDisallowed && isNull) ?
          'The field cannot be empty'
          : UIManager.validate(this, key, value);

        if (mess !== undefined) {
          errors.push({attr: key, message: mess});
        }
      }, this);

      if (errors.length > 0) return errors;
    },

    initialize: function() {
      this.on('invalid', function(model, errors) {
        var details = _.map(errors, function(err) { return '<b>'+app.capitalize(err.attr)+':</b> '+err.message; }).join('</li><li>');
        var error_id = (this.id)? this.id : 'New';
        details = app.capitalize(this.parent.get('column_name')) + ' (' + error_id + ')' + '<hr><ul><li>' + details + '</li></ul>';
        app.trigger('alert:error', 'There seems to be a problem...', details);
      });
    },
  });
});
