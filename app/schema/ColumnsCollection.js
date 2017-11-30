define(function(require, exports, module) {
  'use strict';

  var Backbone = require('backbone'),
      _ = require('underscore'),
      ColumnModel = require('./ColumnModel');

  var columnsOptions = ['table'];

  module.exports = Backbone.Collection.extend({

    model: ColumnModel,

    comparator: function (row) {
      return row.get('sort');
    },

    parse: function (result) {
      return result.data ? result.data : result;
    },

    clone: function () {
      return new this.constructor(this.models, {table: this.table});
    },

    getVisibleInputColumns: function () {
      return this.filter(function (column) {
        return column.isInputVisible();
      });
    },

    getVisibleInputColumnsName: function () {
      return _.invoke(this.getVisibleInputColumns(), 'get', 'column_name')
    },

    getRelationalColumns: function () {
      return this.filter(function (column) {
        return column.hasRelated();
      });
    },

    hasRelationalColumns: function () {
      return this.getRelationalColumns().length > 0;
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

    bindEvents: function () {
      this.on('add', this._onAdd, this);
    },

    _onAdd: function (model, collection) {
      model.table = collection.table;
    },

    constructor: function (models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      _.extend(this, _.pick(options, columnsOptions));
      this.bindEvents();
    }
  });
});
