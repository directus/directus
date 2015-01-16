define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  var Collection = Backbone.Collection.extend({

    initialize: function(models, options) {
      this.filters = options.filters;
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
      if (this.getFilter('sort_order') === 'DESC') models.reverse();
      return models;
    },

    comparator: function(row) {
      var UIManager = require('core/UIManager');
      var column = this.getFilter('sort') || 'id';
      var value = row.get(column);
      var options, ui, type, schema;

      //There is no value
      if (!row.has(column)) {
        if (this.structure && this.structure.get(column) !== undefined) {
          schema = this.structure.get(column);
          ui = schema.get('ui');

          options = UIManager.getSettings(ui);
          if (options.length > 0) {

            //Merge the column values, eg first_name, last_name
            if (_.isArray(options.sortBy)) {
              return _.map(options.sortBy, function(value) { return row.get(value); }).join('');
            }

            return row.get(options.sortBy);

          }
        }
        value = row.id;
      }

      //Check if date
      // handling date is weird
      // if there is a number it would return a number
      // @todo validate this
      if(typeof value === "string") {
        if(!isNaN(Date.parse(value))) {
          return new Date(value).getTime();
        }
      }

      return value;
    },

    setOrder: function(column, sortOrder, options) {
      //useless without filters...
      if (!this.filters) return;

      //If we have nested collection pass this reorder down
      if(this.nestedCollection) {
        this.nestedCollection.setOrder(column, sortOrder, options);
      }

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