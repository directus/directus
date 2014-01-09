define(function(require, exports, module) {

  "use strict";

  var Backbone = require("backbone"),
      Collection = require("core/collection"),
      EntriesModel = require("core/entries/EntriesModel");

  var EntriesCollection = module.exports = Collection.extend({

    model: EntriesModel,

    rowsPerPage: 100,

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

      // very wierd hot-fix to hardcode the user table to always show active=1
      // @todo make sure that preferences and filters follow the rules!
      if ('directus_users' === this.table.id) {
        console.warn('Active users only');
        result.active = "1";
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
      var permissionsArray = permissions.split(',');
      return _.contains(permissionsArray, permissionType);
    },

    isWriteBlacklisted: function(attribute) {
      var writeBlacklist = (this.privileges.get('write_field_blacklist') || '').split(',');
      return _.contains(writeBlacklist, attribute);
    },

    initialize: function(models, options) {
      this.structure = options.structure;
      this.privileges = options.privileges;
      this.table = options.table;

      if (options.rowsPerPage) this.rowsPerPage = options.rowsPerPage;
      if (options.filters) this.filters = options.filters;

      this.url = options.url || this.table.get('url') + '/rows';

      this.active = this.table.get('active');

      this.filters = _.extend({
        currentPage: 0,
        perPage: this.rowsPerPage,
        sort: 'id',
        sort_order: 'ASC',
        active: '1,2'
      }, this.filters);

      if (options.preferences) {
        this.preferences = options.preferences;
        this.preferences.on('change', function() { this.trigger('change'); }, this);
      }
    },

    getNewInstance: function(options) {
      options = options || {};

      var entriesOptions = {
        structure: this.structure,
        table: this.table,
        privileges: this.privileges,
        url: this.url,
        filters: this.filters,
        preferences: this.preferences
      }

      if (options.omit) {
        entriesOptions = _.omit(entriesOptions, options.omit);
      }

      return new EntriesCollection([], entriesOptions);
    },

    parseHeaders: function(response) {
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
    },

    parse: function(response) {
      if (_.isEmpty(response)) return;

      // Parse table headers
      this.parseHeaders(response);

      return response.rows;
    },

    constructor: function EntriesCollection(data, options) {
      EntriesCollection.__super__.constructor.call(this, data, options);
    }

  });

});