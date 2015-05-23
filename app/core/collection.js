define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  var Collection = Backbone.Collection.extend({

    initialize: function(models, options) {
      this.filters = options.filters || {};
    },

    getColumns: function() {
      var cols = (this.length) ? _.keys(this.at(0).toJSON()) : [];
      var result = this.filters.hasOwnProperty('columns_visible') ? _.intersection(cols, this.filters.columns_visible) : cols;
      return result;
    },

    getRows: function() {
      var cols = this.getColumns();
      var models = this.filterMulti({hidden: false});
      return _.map(models, function(model) { return _.pick(model.toJSON(), cols); });
    },

    getModels: function() {
      return this.models;
    },

    getFilters: function() {
      return this.filters;
    },

    getFilter: function(key) {
      return this.filters && this.filters[key];
    },

    setFilter: function(key, value) {
      var attrs;
      if (key === null || typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = value;
      }
      _.each(attrs, function(value, key) {
        this.filters[key] = value;
      }, this);
    },

    // Proxies underscore's sortBy to reverse order

    sortBy: function() {
      var models = _.sortBy(this.models, this.comparator, this);

      return models;
    },

    comparatorValue: function(a, b) {
      var cmp;

      if (typeof a === "string" && typeof b === "string") {
        cmp = a.localeCompare(b);
      } else {
        cmp = ( a > b ) ? 1 : -1;
      }

      if (this.getFilter('sort_order')==='DESC') cmp*=-1;

      return cmp;
    },

    comparator: function(rowA, rowB) {
      var UIManager = require('core/UIManager');
      var column = this.getFilter('sort') || 'id';
      var valueA, valueB;

      // @todo find a better way to check is a entriesjunctioncollection
      if(rowA.collection.nestedCollection && ['sort', 'id'].indexOf(column) < 0) {
        rowA = rowA.get('data');
        rowB = rowB.get('data');
      }

      if (UIManager.hasList(rowA, column)) {
        // Sort relational columns in listview https://github.com/RNGR/Directus/issues/452
        valueA = UIManager.getList(rowA, column) || '';
        valueB = UIManager.getList(rowB, column) || '';
      } else {
        valueA = rowA.get(column);
        valueB = rowB.get(column);
      }

      var options, ui, type, schema;

      //There is no value
      if (!rowA.has(column)) {
        if (this.structure && this.structure.get(column) !== undefined) {
          schema = this.structure.get(column);
          ui = schema.get('ui');

          options = UIManager.getSettings(ui);
          if (options.length > 0) {

            //Merge the column values, eg first_name, last_name
            if (_.isArray(options.sortBy)) {
              valueA = _.map(options.sortBy, function(value) { 
                return rowA.get(value);
              }).join('');
              valueB = _.map(options.sortBy, function(value) { 
                return rowB.get(value);
              }).join('');
            } else {
              valueA = rowA.get(options.sortBy);
              valueB = rowB.get(options.sortBy);
            }
          }
        } else {
          valueA = rowA.id;
          valueB = rowB.id;
        }
      }

      // Check if it's a date
      if(app.isStringADate(valueA)) {
        if(!isNaN(Date.parse(valueA))) {
          return this.comparatorValue(new Date(valueA).getTime(), new Date(valueB).getTime());
        }
      }

      return this.comparatorValue(valueA, valueB);
    },

    setOrder: function(column, sortOrder, options) {
      //useless without filters...
      if (!this.filters) return;

      if (column === undefined) {
        this.setFilter({sort:'id', sort_order: 'ASC'});
      } else {
        this.setFilter({sort: column, sort_order: sortOrder});
      }


      if (this.filters.perPage <= this.table.get('total')) {
        this.fetch();
      } else {
        this.sort(options);
      }
    },

    getOrder: function() {
      var order = {};
      order.sort = this.getFilter('sort');
      order.sort_order = this.getFilter('sort_order');
      return order;
    },

   filterMulti: function(filters) {
      return this.filter(function(model) {
        // Every filter has to pass the test!
        return _.every(filters, function(value, key) { return (model.has(key) && model.get(key) === value); });
      });
    },

    save: function(options) {
      options = options || {};
      var collection = this;
      var success = options.success;

      options.success = function(model, resp, xhr) {
        collection.reset(model ,{parse: true});
        if (success !== undefined) {
          success();
        }
      };

      // would be awesome if this is always how it werkz...
      options.url = this.url + '?' + $.param(this.getFilters());

      return Backbone.sync('update', this, options);
    },

    fetch: function(options) {
      options = options || {};
      options.data = options.data || {};

      if (options.includeFilters === undefined) {
        options.includeFilters = true;
      }

      if (options.includeFilters) {
        var filters = this.getFilters();
        if(filters && filters.columns_visible && !(filters.columns_visible.indexOf(filters.sort) != -1) && this.structure.get(filters.sort)) {
          // when there's only one visible column
          // it's an string so we need to convert it to an array
          if(typeof filters.columns_visible === 'string') {
            filters.columns_visible = filters.columns_visible.split();
          }
          filters.columns_visible.push(filters.sort);
        }
        _.extend(options.data, filters);
      }
      this.trigger('fetch', this);
      return Backbone.Collection.prototype.fetch.call(this, options);
    }

  });

  return Collection;
});