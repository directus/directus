define(function(require, exports, module) {
  'use strict';

  var Backbone = require('backbone'),
      app = require('app'),
      _ = require('underscore'),
      StatusHelper = require('helpers/status'),
      ColumnsCollection = require('./ColumnsCollection'),
      PreferenceModel = require('./../core/PreferenceModel');

  module.exports =  Backbone.Model.extend({

    parse: function (data) {
      data = data.data ? data.data : data;

      if (this.columns === undefined) {
        this.columns = new ColumnsCollection(data.columns, {
          parse: true,
          table: this,
          url: this.url + '/columns'
        });
      } else {
        this.columns.reset(data.columns, {parse: true});
      }

      if (data.preferences !== undefined) {
        if (this.preferences === undefined) {
          var preference = data.preferences;
          this.preferences = new PreferenceModel(data.preferences, {url: app.API_URL + 'tables/' + preference.table_name + '/preferences'})
        } else {
          this.preferences.set(data.preferences);
        }
      }

      if (!data.status_column) {
        var status = app.statusMapping.get(data.id, false);

        if (status) {
          data.status_column = status.get('status_name');
        }
      }

      return _.omit(data, ['columns', 'preferences']);
    },

    getStatusColumn: function () {
      var name = this.get('status_column');
      var status;

      if (!name) {
        status = app.statusMapping.get(this.id, false);
        if (status) {
          name = status.get('status_name');
        }
      }

      return name ? this.columns.get(name) : null;
    },

    getStatusColumnName: function () {
      var column = this.getStatusColumn();
      return column ? column.get('column_name') : null;
    },

    hasStatusColumn: function () {
      return this.getStatusColumn() != null;
    },

    getStatusDefaultValue: function () {
      var statusColumn = this.getStatusColumn();
      var defaultStatusValue = app.statusMapping.get(this.id, true).get('status_name');

      return statusColumn.get('default_value') || defaultStatusValue;
    },

    getStatusVisibleValues: function () {
      return StatusHelper.getStatusVisibleValues(this.id);
    },

    getSortColumn: function () {
      // set a default primary key, same as default sort and status
      var name = this.get('sort_column');

      return this.columns.get(name);
    },

    hasSortColumn: function () {
      return this.getSortColumn() != null;
    },

    getSortColumnName: function () {
      var column = this.getSortColumn();

      return column ? column.get('column_name') : null;
    },

    getPrimaryColumn: function () {
      var name = this.get('primary_column') || 'id';

      return this.columns.get(name);
    },

    hasPrimaryColumn: function () {
      return this.getPrimaryColumn() != null;
    },

    getPrimaryColumnName: function () {
      var column = this.getPrimaryColumn();

      return column ? column.get('column_name') : null;
    },

    isSystemTable: function () {
      return (this.get('table_name') || '').startsWith('directus_');
    },

    toJSON: function (options) {
      var attrs = _.clone(this.attributes);

      attrs.columns = this.columns.toJSON();

      return attrs;
    },

    constructor: function TableModel() {
      return Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
});
