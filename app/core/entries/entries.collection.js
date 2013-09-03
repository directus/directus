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
      var columns = (this.filters.columns_visible !== undefined) ? this.filters.columns_visible : _.intersection(this.structure.pluck('id'), this.preferences.get('columns_visible').split(','));
      return columns;
    },

    getFilter: function(key) {
      return (this.preferences && this.preferences.has(key)) ? this.preferences.get(key) : this.filters[key];
    },

    getFilters: function() {
      var preferences = this.preferences ? this.preferences.toJSON() : {};
      var filters = _.clone(this.filters);

      //Temporary fix to turn columns_visible into an array. @todo: Move this to the preferences object
      if (preferences.hasOwnProperty('columns_visible')) {
        preferences.columns_visible = preferences.columns_visible.split(',');
      }

      var result = _.extend(filters, _.pick(preferences, 'columns_visible', 'sort', 'sort_order', 'active'));

      // preferences normally trump filters, this is an edge case
      // @todo fix the data structure to make this logic less wierd
      if (this.filters.hasOwnProperty('columns_visible')) {
        result.columns_visible = this.filters.columns_visible;
      }

      return result;
    },

    getTotalCount: function() {
      var totalCount;

      switch (this.getFilter('active')) {
        case '1,2':
          totalCount = this.table.get('active');
          if (this.table.has('inactive')) {
            totalCount += this.table.get('inactive');
          }
          break;
        case '1':
          totalCount = this.table.get('active');
          break;
        case '2':
          totalCount = this.table.get('inactive');
          break;
        case '0':
          totalCount = this.table.get('trash');
          break;
      }

      return totalCount;

    },

    setFilter: function(key, value, options) {
      var attrs, preferencesHasChanged = false;
      if (key === null || typeof key === 'object') {
        attrs = key;
      } else {
        (attrs = {})[key] = value;
      }
      _.each(attrs, function(value, key) {
        if (this.preferences && this.preferences.has(key)) {
          preferencesHasChanged = true;
          this.preferences.set(key, value, {silent: true});
        } else {
          this.filters[key] = value;
        }
      },this);
      if (preferencesHasChanged) this.preferences.save();
    },

    hasColumn: function(columnName) {
      return this.structure.get(columnName) !== undefined;
    },

    hasPermission: function(permissionType) {
      var permissions = this.privileges.get('permissions') || '';
      permissionsArray = permissions.split(',');
      return _.contains(permissionsArray, permissionType);
    },

    isWriteBlacklisted: function(attribute) {
      var writeBlacklist = (this.privileges.get('write_field_blacklist') || '').split(',');
      return _.contains(writeBlacklist, attribute);
    },

    initialize: function(models, options) {
      var rowsPerPage = options.rowsPerPage || parseInt(app.settings.get('global').get('rows_per_page'),10) || 500;
      this.structure = options.structure;
      this.privileges = options.privileges;
      this.table = options.table;
      this.active = this.table.get('active');
      this.url = options.url || this.table.get('url') + '/rows';
      this.filters = _.extend({ currentPage: 0, perPage: rowsPerPage, sort: 'id', sort_order: 'ASC', active: '1,2' }, options.filters);

      if (options.preferences) {
        this.preferences = options.preferences;
        this.preferences.on('change', function() { this.trigger('change'); }, this);
      }
    },

    parse: function(response) {

      if (_.isEmpty(response)) return;

      if (response.total !== undefined) {
        this.table.set('total', response.total, {silent: true});
      }

      if (response.active !== undefined) {
        this.table.set('active', response.active, {silent: true});
      }

      if (response.inactive !== undefined) {
        this.table.set('inactive', response.inactive, {silent: true});
      }

      if (response.trash !== undefined) {
        this.table.set('trash', response.trash, {silent: true});
      }

      return response.rows;
    }

  });

  return EntriesCollection;

});