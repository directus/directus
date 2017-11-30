define([
  'app',
  'backbone',
  'helpers/status',
  'utils',
  'underscore'
],

function(app, Backbone, StatusHelper, Utils, _) {

  'use strict';

  var Collection = Backbone.Collection.extend({

    constructor: function (models, options) {
      options.sort = false;
      Backbone.Collection.prototype.constructor.apply(this, [models, options]);
    },

    initialize: function(models, options) {
      this.filters = options.filters || {};
    },

    getColumns: function(columnsVisible) {
      var columns = (this.length) ? _.keys(this.at(0).toJSON()) : [];

      if (columnsVisible) {
        columns = _.intersection(columns, columnsVisible);
      } else if (this.filters.hasOwnProperty('columns_visible')) {
        columns = _.intersection(columns, this.filters.columns_visible);
      }

      return columns;
    },

    getRows: function() {
      var cols = this.getColumns();
      var models = this.filterMulti({hidden: false});
      return _.map(models, function(model) { return _.pick(model.toJSON(), cols); });
    },

    getRowsModel: function() {
      return this.filterMulti({hidden: false});
    },

    getTotalCount: function() {
      var totalCount;
      // Let's have the collection length
      // to replace the table total when we add items
      // because we are not updating this value
      // we are just fetching it once
      // @TODO: update this value on collection change
      var collectionCount = this.length;

      // There is no active column. Use total
      // if (!this.table.columns.get(app.statusMapping.status_name)) {
      if (!this.table.hasStatusColumn()) {
        // NOTE: "total_entries" will return all the entries (total) in a table
        // while "total" is the total entries returned
        return Math.max(this.table.get('total_entries'), collectionCount);
      }

      var visibleStates = Utils.parseCSV(this.getFilter('status'));
      totalCount = 0;

      visibleStates.forEach(function (state) {
        var status = StatusHelper.getStatus(this.table.id, state);
        if (status) {
          totalCount += this.table.get(status.get('name')) || 0;
        }
      }, this);

      return Math.max(totalCount, collectionCount);
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

    removeFilter: function (key) {
      delete this.filters[key];
    },

    clearFilter: function () {
      this.filters = {};
    },

    // Proxies underscore's sortBy to reverse order

    sortBy: function (attributes) {
      var self = this;

      if (_.isArray(attributes)) {
        return this.models.sort(_.bind(function (a, b) {
          var attr;
          var r;

          for (var i in attributes) {
            if (!attributes.hasOwnProperty(i)) {
              continue;
            }

            attr = attributes[i];
            r = self.comparator.apply(self, [a, b, attr]);

            if (r !== 0) {
              return r;
            }
          }
        }, this));
      }

      return _.sortBy(this.models, this.comparator, this);
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

    comparator: function (rowA, rowB, sortBy) {
      var UIManager = require('core/UIManager');
      var column = rowA.idAttribute;
      var table = rowA.table ? rowA.table : this.table;
      var sortColumn;
      var valueA, valueB;

      sortColumn = table ? table.getSortColumnName() : null;

      if (!sortColumn) {
        sortColumn = this.table ? this.table.getPrimaryColumnName() : 'id';
      }

      if (this.getFilter('sort')) {
        column = this.getFilter('sort')
      } else if (this.hasColumn && this.hasColumn('sort')) {
        column = sortColumn;
      } else if (this.junctionStructure && this.junctionStructure.get(sortColumn)) {
        column = sortColumn;
      }

      // force sorting by the given column
      if (_.isString(sortBy)) {
        column = sortBy;
      }

      // @todo find a better way to check is a entriesjunctioncollection
      var EntriesJunctionCollection = require('core/entries/EntriesJunctionCollection');
      if(rowA instanceof EntriesJunctionCollection.prototype.model && [sortColumn, rowA.idAttribute].indexOf(column) < 0) {
        rowA = rowA.get('data');
        rowB = rowB.get('data');
      }

      // Sort relational columns in listview https://github.com/RNGR/Directus/issues/452
      valueA = UIManager.getSortValue(rowA, column) || '';
      valueB = UIManager.getSortValue(rowB, column) || '';

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

      return this.comparatorValue(valueA, valueB);
    },

    setOrder: function(column, sortOrder, options) {
      //useless without filters...
      if (!this.filters) return;

      if (column === undefined) {
        this.setFilter({sort:'id', sort_order: 'ASC'});
      } else {
        var columnModel = this.structure.get(column);
        options = options || {};

        // NOTE: if the column doesn't exist, do not save it to preferences
        if (!columnModel || _.result(columnModel, 'isFake')) {
          options.save = false;
        }

        this.setFilter({sort: column, sort_order: sortOrder}, options);
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

        collection.trigger('sync', collection, resp, options);
      };

      // would be awesome if this is always how it werkz...
      options.url = this.url + '?' + $.param(this.getFilters());

      return Backbone.sync('update', this, options);
    },

    fetch: function(options) {
      options = options || {};
      options.data = options.data || {};

      if (options.includeFilters === undefined || options.replaceOptions) {
        options.includeFilters = true;
      }

      if (options.includeFilters) {
        var filters = options.replaceOptions || this.getFilters();
        var primaryColumn = this.table.getPrimaryColumnName();
        var sortColumn = this.table.getSortColumnName();
        var statusColumn = this.table.getStatusColumnName();

        // remove falsy columns value
        filters.columns_visible = _.compact(filters.columns_visible);

        if (filters && filters.columns_visible && !(filters.columns_visible.indexOf(filters.sort) !== -1) && this.structure.get(filters.sort)) {
          // when there's only one visible column
          // it's an string so we need to convert it to an array
          if (typeof filters.columns_visible === 'string') {
            filters.columns_visible = Utils.parseCSV(filters.columns_visible);
          }

          filters.columns_visible.push(filters.sort);
        }

        if (filters.columns_visible && filters.columns_visible.length > 0) {
          var columnsName = [primaryColumn, statusColumn, sortColumn];
          _.each(columnsName, function (column) {
            if (this.isReadBlacklisted && this.isReadBlacklisted(column)) {
              return false;
            }

            // Make sure to include the system columns in visible columns list
            if (column && filters.columns_visible && filters.columns_visible.indexOf(column) === -1) {
              filters.columns_visible.push(column);
            }
          }, this);

          filters.columns_visible = (filters.columns_visible || '').join(',');
        }

        _.extend(options.data, filters);
      }

      // @NOTE: Do we need it?
      // this.trigger('fetch', this);

      return Backbone.Collection.prototype.fetch.call(this, options);
    }
  });

  return Collection;
});
