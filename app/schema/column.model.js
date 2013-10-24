define(function(require, exports, module) {

  "use strict";

  var app = require('app'),
      UIModel = require('./ui.model');

  module.exports = Backbone.Model.extend({

      parse: function(result) {

        // initialize Schema
        var ui = result.ui;
        var tableName = '';

        if (_.isEmpty(ui)) {
          throw new Error("Column '"+ result.id + "' in table '" + tableName + "' does not have a UI");
        }
        if (!app.uiSettings.hasOwnProperty(ui)) {
          throw new Error("The UI '" + ui + "', set for the column '" + result.id + "' in the table '" + tableName + "' does not exist!");
        }

        // make sure that the structure is the right kind for the UI
        // @todo: move this to options instead so it doesn't need to change
        this.structure = app.uiSettings[ui].schema;

        // initialize UI
        var options = result.options || {};
        options.id = result.ui;
        this.options = new UIModel(options);
        this.options.parent = this;
        delete result.options;

        if (result.master) result.header = true;
        result.header = (result.header === "true" || result.header === true || result.header === 1 || result.header === "1") ? true : false;

        return result;
      },

      getOptions: function() {
        return this.options.get(this.attributes.ui);
      },

      getRelated: function() {
        if (this.get('ui') === 'many_to_one') {
          return this.options.get('table_related');
        }
        //@todo get rid of this hard dependency
        if (this.get('ui') === 'single_media') {
          return 'directus_media';
        }

        return this.get('table_related');
      },

      getTable: function() {
        return this.collection.table;
      },

      getRelationshipType: function() {
        var type = this.get('type');
        var ui = this.get('ui');

        if (_.contains(['MANYTOMANY', 'ONETOMANY'], type)) return type;
        if (_.contains(['many_to_one','single_media'],ui)) return 'MANYTOONE';
      },

      hasRelated: function() {
        return this.getRelated() !== undefined;
      },

      isNullable: function() {
        return this.get('is_nullable') === 'YES';
      },

      isRequired: function() {
        return this.get('required') || !this.isNullable();
      },

      toJSON: function(options) {
        if (options && options.columns) {
          return _.pick(this.attributes, options.columns);
        }
        return _.clone(this.attributes);
      }

  });

});