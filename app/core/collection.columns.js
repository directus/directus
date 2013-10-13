define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  var Structure = {};

  Structure.UI = Backbone.Model.extend({

    url: function() {
      return this.parent.url() + '/' + this.id;
    },

    getStructure: function() {
      return this.parent.structure;
    },

    getTable: function() {
      return this.parent.getTable();
    },

    //@todo: This is code repetition. Almost identical to entries.model. Create a mixin?
    validate: function(attributes, options) {
      var errors = [];
      var structure = this.getStructure();

      //only validates attributes that are part of the schema
      attributes = _.pick(attributes, structure.pluck('id'));

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

  Structure.Column = Backbone.Model.extend({

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
        this.options = new Structure.UI(options);
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

  //The equivalent of a MySQL columns Schema
  Structure.Columns = Backbone.Collection.extend({

    model: Structure.Column,

    comparator: function(row) {
      return row.get('sort');
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
    }
  });
  return Structure;
});