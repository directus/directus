define(function(require, exports, module) {

  'use strict';

  var app = require('app'),
      Backbone = require('backbone'),
      _ = require('underscore'),
      UIModel = require('./UIModel'),
      RelationshipModel = require('./RelationshipModel');

  var columnOptions = ['table'];

  module.exports = Backbone.Model.extend({

    parse: function (result) {
      result = result.data ? result.data : result;

      var ui = result.ui;
      var tableName = '';

      if (_.isEmpty(ui)) {
        throw new Error("Column '"+ result.id + "' in table '" + tableName + "' does not have a UI");
      }

      // if the url was set explicit with an string
      // let's add the column name.
      if (!_.isFunction(this.url)) {
        if (this.oldUrl) {
          this.url = this.oldUrl;
        }

        this.oldUrl = this.url;
        this.url += '/' + result.column_name;
      }

      // Can this be done elsewhere so we can break the app dependency?
      /*if (!app.uiManager.hasUI(ui)) {
        throw new Error("The UI '" + ui + "', set for the column '" + result.id + "' in the table '" + tableName + "' does not exist!");
      }*/

      // make sure that the structure is the right kind for the UI
      // @todo: move this to options instead so it doesn't need to change
      //this.structure = app.uiSettings[ui].schema;

      // this.structure = new ColumnsCollection(uiStructure, {parse: true});
      // initialize UI
      var options = result.options || {};
      options.id = result.ui;
      this.options = new UIModel(options);
      this.options.parent = this;

      if (result.relationship_type) {
        var relationshipAttrs = _.pick(result, [
          'relationship_type',
          'related_table',
          'junction_table',
          'junction_key_right',
          'junction_key_left'
        ]);

        this.relationship = new RelationshipModel(relationshipAttrs, {parse: true});
        this.relationship.parent = this;
      }

      result.header = result.header === true || result.header === "true" || result.header === 1;
      // UI Settings input should not be require by default
      // if required and is_nullable is not set
      // should fallback to required = false, is_nullable = YES
      result.required = result.required === true;
      result.is_nullable = result.is_nullable ? result.is_nullable : 'YES';

      return _.omit(result, 'options', 'relationship');
    },

    getOptions: function () {
      return this.options.get(this.attributes.ui);
    },

    getRelated: function () {
      return this.relationship.get('related_table');
    },

    getTable: function () {
      return this.collection.table;
    },

    get: function (attr, skip) {
      if (attr === 'length' && !this.isNew() && !skip && this.isEnumOrSet()) {
        return this.getValues();
      }

      return Backbone.Model.prototype.get.apply(this, arguments);
    },

    getRelationshipType: function () {
      if (!this.hasRelated()) {
        return;
      }

      return this.relationship.get('type');
    },

    isAlias: function () {
      return (this.get('type') || '').toUpperCase() === 'ALIAS';
    },

    isRelational: function () {
      return !!this.getRelationshipType();
    },

    hasRelated: function () {
      return this.relationship !== undefined;
    },

    isNullable: function () {
      return this.get('nullable') === true;
    },

    isRequired: function () {
      return this.get('required') || !this.isNullable();
    },

    isStatusColumn: function () {
      return this.table.getStatusColumnName() === this.id;
    },

    isPrimaryColumn: function () {
      return this.table.getPrimaryColumnName() === this.id;
    },

    isSortColumn: function () {
      return this.table.getSortColumnName() === this.id;
    },

    getColumnTypeLength: function () {
      var columnType = this.get('column_type') || '';
      var match = columnType.match(/\((\d+)\)/);

      return match ? match[1] : null;
    },

    getLength: function () {
      return this.getColumnTypeLength() || this.get('length');
    },

    isEnumOrSet: function () {
      return this.isEnum() || this.isSet();
    },

    isEnum: function () {
      return this.is(this.get('type'), 'ENUM')
    },

    isSet: function () {
      return this.is(this.get('type'), 'SET');
    },

    is: function (value, type) {
      type = (type || '').toLowerCase();
      value = (value || '').toLowerCase();

      return type === value;
    },

    // gets the value from ENUM/SET value list
    getValues: function () {
      if (!this.isEnumOrSet()) {
        return;
      }

      var columnType = this.get('column_type') || '';
      var values, size;

      if (this.isSet()) {
        size = 4;
      } else if (this.isEnum()) {
        size = 5;
      }

      values = columnType.substr(size, columnType.length-(size + 1)); //Remove enum() from string
      values = values.replace(/'/g, '');

      return values;
    },

    toJSON: function (options) {
      if (options && options.columns) {
        return _.pick(this.attributes, options.columns);
      }
      return _.clone(this.attributes);
    },

    constructor: function (attributes, options) {
      options = options || {};

      Backbone.Model.prototype.constructor.apply(this, arguments);

      _.extend(this, _.pick(options, columnOptions));
    }
  });
});
