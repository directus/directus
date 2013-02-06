define([
  "app",
  "backbone"
],

function(app, Backbone) {

  var Collection = Backbone.Collection.extend({

    initialize: function(models, options) {
      this.filters = options.filters;
    },

    getColumns: function() {
      var cols = (this.length) ? _.keys(this.at(0).toJSON()) : [];
      return this.filters.hasOwnProperty('columns') ? _.intersection(cols, this.filters.columns) : cols;
    },

    getRows: function() {
      var cols = this.getColumns();
      var models = this.filterMulti({hidden: false});
      return _.map(models, function(model) { return _.pick(model.toJSON(), cols); });
    },

    // Proxies underscore's sortBy to reverse order

    sortBy: function() {
      var models = _.sortBy(this.models, this.comparator, this);
      if (this.filters && this.filters.orderDirection === 'DESC') models.reverse();
      return models;
    },

    comparator: function(row) {
      var column = this.filters ? this.filters.orderBy : 'id';
      var value = row.get(column);
      var options, ui, type;

      //There is no valu
      if (!row.has(column)) {
        if (this.structure) {
          schema = this.structure.get(column);
          ui = schema.get('ui');

          options = app.uiSettings[ui];
          if (options.sortBy !== undefined) {

            //Merge the column values, eg first_name, last_name
            if (_.isArray(options.sortBy)) {
              return _.map(options.sortBy, function(value) { return row.get(value); }).join('');
            }

            return row.get(options.sortBy);

          }
        }
        value = row.id;
      }
      return value;
    },

    setOrder: function(column, orderDirection, options) {
      //useless without filters...
      if (!this.filters) return;

      if (column === undefined) {
        this.filters.orderBy = 'id';
        this.filters.orderDirection = 'ASC';
      } else {
        this.filters.orderBy = column;
        this.filters.orderDirection = orderDirection;
      }

      if (this.filters.perPage < this.total) {
        this.fetch();
      } else {
        this.sort(options);
      }
    },

    getOrder: function() {
      var order = {};
      if (this.filters) {
        order.orderBy = this.filters.orderBy;
        order.orderDirection = this.filters.orderDirection;
      }
      return order;
    },

    filterMulti: function(filters) {
      return this.filter(function(model) {
        // Every filter has to pass the test!
        return _.every(filters, function(value, key) { return (model.has(key) && model.get(key) === value); });
      });
    },


/*
    toJSON: function(options) {
      return this.map(function(model){
        console.log(model.toJSON(options));
        return model.toJSON(options);
      });
    },
*/
    save: function(options) {
      options = options || {};
      var collection = this;
      var success = options.success;

      options.success = function(model, resp, xhr) {
        collection.reset(resp ,{parse: true});
        if (success !== undefined) {
          success();
        }
      };

      // would be awesome if this is always how it werkz...
      options.url = this.url + '?' + $.param(this.filters);

      return Backbone.sync('update', this, options);
    },

    fetch: function(options) {
      options = options || {};
      options.data = options.data || {};

      this.trigger('fetch', this);

      _.extend(options.data, this.filters);
      return Backbone.Collection.prototype.fetch.call(this, options);
    }

  });

  return Collection;
});