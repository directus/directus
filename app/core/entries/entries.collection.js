define([
  "app",
  "backbone",
  "core/collection",
  "core/entries/entries.model"
],

function(app, Backbone, Collection, EntriesModel) {

  var EntriesCollection = Collection.extend({

    model: EntriesModel,

    toJSON: function(options) {
      options = options || {};
      var result = EntriesCollection.__super__.toJSON.apply(this, [options]);
      if (options.changed) {
        result = _.filter(result, function(obj) { return !_.isEmpty(obj); });
      }
      return result;
    },

    getColumns: function() {
      return (this.filters.columns !== undefined) ? this.filters.columns : _.intersection(this.structure.pluck('id'), this.preferences.get('columns_visible').split(','));
    },

    getFilter: function(key) {
      return (this.preferences && this.preferences.has(key)) ? this.preferences.get(key) : this.filters[key];
    },

    getFilters: function() {
      return _.extend(this.filters, _.pick(this.preferences.toJSON(),'columns_visible','sort','sort_order','active'));
    },

    setFilter: function(key, value, options) {
      var attrs;
      if (key === null || typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = value;
      }
      _.each(attrs, function(value, key) {
        if (this.preferences.has(key)) {
          this.preferences.set(key, value, {silent: true});
        } else {
          this.filters[key] = value;
        }
      },this);
      this.preferences.save();
    },

    initialize: function(models, options) {
      this.structure = options.structure;
      this.table = options.table;
      this.active = this.table.get('active');
      this.url = options.url || this.table.get('url') + '/rows';
      this.filters = _.extend({ currentPage: 0, perPage: 500, sort: 'id', sort_order: 'ASC', active: '1,2' }, options.filters);
      if (options.preferences) {
        this.preferences = options.preferences;
        this.preferences.on('change', function() { this.trigger('change'); }, this);
      }
    },

    parse: function(response) {

      if (_.isEmpty(response)) return;

      console.log(response);

      if (response.total !== undefined) {
        this.total = response.total;
        this.table.set('total', this.total, {silent: true});
      }

      if (response.active !== undefined) {
        this.active = response.active;
        this.table.set('active', this.active, {silent: true});
      }

      if (response.total !== undefined && response.active !== undefined) {
        this.inactive = response.total - response.active;
        this.table.set('inactive', this.inactive, {silent: true});
      }

      if (response.trash !== undefined) {
        this.trash = response.trash;
        this.table.set('trash', this.trash, {silent: true});
      }

      return response.rows;
    }

  });

  return EntriesCollection;

});