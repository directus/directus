define(function(require, exports, module) {

  'use strict';

  var app       = require('app');
  var _         = require('underscore');
  var Utils     = require('utils');
  var Backbone  = require('backbone');
  var __t       = require('core/t');
  var $         = require('jquery');

  var PreferenceModel = module.exports = Backbone.Model.extend({

    // TODO: Remove all .get('columns_visible').split(',')
    // ADD getVisibleColumns() and returns an array
    defaults: {
      columns_visible: '',
      status: ''
    },

    url: function () {
      return app.API_URL + 'tables/' + encodeURIComponent(this.get('table_name')) + '/preferences';
    },

    parse: function(data) {
      return data.meta ? data.data : data;
    },

    fetch: function (options) {
      // @NOTE: Do we need this?
      // this.trigger('fetch', this);
      var args = {
        data: $.param((options || {}))
      };

      return this.constructor.__super__.fetch.call(this, args);
    },

    getSearchStringParams: function () {
      var search = this.get('search_string');
      var tableName = this.get('table_name');
      var structure = tableName ? app.schemaManager.getColumns('tables', tableName) : null;
      var filters = [];

      if (search && structure) {
        search = decodeURIComponent(search).replace('\\,', '%21').split(',');
        search.forEach(function (filter) {
          var data = {};

          filter = filter.replace('\\:', '%20');
          filter = filter.split(':');

          if (filter.length === 2) {
            data = {};
            data.filterData = {
              id: filter[0].replace('%20',':'),
              value: filter[1].replace('%20',':').replace('%21',',')
            };

            filters.push(data);
          } else if (filter.length === 3) {
            data = {};
            var selectedColumn = filter[0].replace('%20',':');

            data.columnName = selectedColumn;
            if (!structure.get(selectedColumn)) {
              return;
            }

            data.filter_type = structure.get(selectedColumn).get('type');
            data.filterData = {id: selectedColumn, type: filter[1].replace('%20',':'), value: filter[2].replace('%20',':').replace('%21',',')};

            filters.push(data);
          }
        });
      }

      return filters;
    },

    getFilters: function () {
      var filters = this.getSearchStringParams();

      // convert from search string format object to filters param object
      var params = {};
      _.each(filters, function (filter) {
        filter = filter.filterData;

        if (filter.type) {
          if (!params.filters) {
            params.filters = {};
          }

          params.filters[filter.id] = {};
          params.filters[filter.id][filter.type] = filter.value;
        } else {
          params[filter.id] = filter.value;
        }
      });

      return params;
    },

    getStatuses: function () {
      return Utils.parseCSV(this.get('status'));
    },

    getListViewOptions: function (attr) {
      var viewOptions = {};

      try {
        viewOptions = JSON.parse(this.get('list_view_options')) || {};
      } catch (err) {
        viewOptions = {};
        console.error(__t('calendar_has_malformed_options_json'));
      }

      return attr ? viewOptions[attr] : viewOptions;
    },

    getAllViewOptions: function(viewId) {
      var viewOptions = this.getListViewOptions();

      if (viewId) {
        viewOptions = viewOptions[viewId] || {};
      }

      return viewOptions;
    },

    getViewOptions: function (viewId, attr) {
      var options = this.getAllViewOptions(viewId);

      return attr ? options[attr] : options;
    }
  });
});
