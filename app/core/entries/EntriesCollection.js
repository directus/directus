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
      var filters = this.getFilters();
      var columns = [];

      if (filters.columns_visible === undefined) {
        columns = this.structure.pluck('id');
      } else {
        columns = filters.columns_visible;
        // @todo: ensure that this always be an array everywhere.
        if (typeof columns === 'string') {
          columns = columns.split();
        }
      }

      if (this.preferences) {
        columns = _.intersection(columns, this.preferences.get('columns_visible').split(','));
      }

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

      var result = _.extend(filters, _.pick(preferences, 'columns_visible', 'sort', 'sort_order', app.statusMapping.status_name));

      // preferences normally trump filters, this is an edge case
      // @todo fix the data structure to make this logic less wierd
      if (this.filters.hasOwnProperty('columns_visible')) {
        result.columns_visible = this.filters.columns_visible;
      }

      // very wierd hot-fix to hardcode the user table to always show status=1
      // @todo make sure that preferences and filters follow the rules!
      if ('directus_users' === this.table.id) {
        // console.warn('Active users only');
        result[app.statusMapping.status_name] =  app.statusMapping.active_num;
      }

      return result;
    },

    getTotalCount: function() {
      var totalCount;

      // There is no active column. Use total
      if (!this.table.columns.get(app.statusMapping.status_name)) {
        return this.table.get('total');
      }

      var visibleStates = this.getFilter(app.statusMapping.status_name).split(',');
      totalCount = 0;

      var that = this;
      visibleStates.forEach(function(state) {
        if(state in app.statusMapping.mapping && that.table.has(app.statusMapping.mapping[state].name)) {
          totalCount += that.table.get(app.statusMapping.mapping[state].name);
        }
      });

      return totalCount;

    },

    updateActiveCount: function(diff) {
      if(!this.table.has('active')) {
        return;
      }

      switch (this.getFilter('active')) {
        case '1':
          this.table.set({'active': this.table.get('active') - diff});
          break;
        case '2':
          this.table.set({'inactive': this.table.get('inactive') - diff});
          break;
        case '0':
          this.table.set({'trash': this.table.get('trash') - diff});
          break;
      }
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
      var permissionLevel = 1;
      var permissionName = permissionType;
      if (permissionType.indexOf('big') === 0) {
        permissionLevel = 2;
        permissionName = permissionType.substr(3);
      }

      if (this.privileges.has('allow_' + permissionName) && permissionLevel <= this.privileges.get('allow_' + permissionName)) {
        return true;
      }

      return false;
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
        sort_order: 'ASC'
      }, this.filters);

      // do we got a sort column?
      // let sort it by that instead please
      if(this.structure.get('sort')) {
        this.filters['sort'] = 'sort';
      }

      this.filters[app.statusMapping.status_name] = '1,2';

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
      };

      if (options.omit) {
        entriesOptions = _.omit(entriesOptions, options.omit);
      }

      return new EntriesCollection([], entriesOptions);
    },

    parseHeaders: function(response) {
      if (response.total !== undefined) {
        this.table.set('total', response.total, {silent: true});
      }
      var that = this;
      app.statusMapping.mapping.forEach(function(status) {
        if(response[status.name]) {
          that.table.set(status.name, response[status.name], {silent: true});
        }
      });
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