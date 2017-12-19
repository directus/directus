define(function(require, exports, module) {

  'use strict';

  var Backbone            = require('backbone'),
      app                 = require('app'),
      _                   = require('underscore'),
      Utils               = require('utils'),
      Collection          = require('core/collection'),
      StatusMixin         = require('mixins/status'),
      SaveCollectionMixin = require('mixins/save-collection'),
      PreferenceModel     = require('core/PreferenceModel'),
      EntriesModel        = require('core/entries/EntriesModel');

  var EntriesCollection = module.exports = Collection.extend({

    model: EntriesModel,

    rowsPerPage: 100,

    toJSON: function(options) {
      options = options || {};
      var result = EntriesCollection.__super__.toJSON.apply(this, [options]);
      if (options.changed) {
        result = _.filter(result, function(obj) { return !_.isEmpty(obj); });
      }
      return options.insideRows === true ? {rows: result} : result;
    },

    map: function () {
      var args = Array.prototype.slice.call(arguments);
      var models = this.models;

      // hotfix: take public group out on mapping
      // we use mapping to iterate over each items
      // this way public user group can be omitted
      // @TODO: create a group collection on fetch if the table is directus_groups
      // allowing to create table-specific filtering
      if (this.table && this.table.id === 'directus_groups') {
        models = _.filter(this.models, function (model) {
          return (model.get('name') || '').toLowerCase() != 'public';
        });
      }

      args.unshift(models);

      return _['map'].apply(_, args);
    },

    getColumns: function() {
      var filters = this.getFilters();
      var columns = [];
      var structure = this.structure;

      if (_.isEmpty(filters.columns_visible)) {
        columns = structure.pluck('id');
      } else {
        columns = filters.columns_visible;
        // @todo: ensure that this always be an array everywhere.
        if (typeof columns === 'string') {
          columns = Utils.parseCSV(columns);
        }
      }

      columns = columns.filter(function (column) {
        return structure.get(column) && !structure.get(column).get('hidden_input');
      });

      var visibleColumns = this.preferences.get('columns_visible');
      if (!_.isEmpty(visibleColumns)) {
        columns = _.intersection(columns, Utils.parseCSV(visibleColumns));
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
        preferences.columns_visible = Utils.parseCSV(preferences.columns_visible);
      }

      var result = _.extend(filters, _.pick(preferences, 'columns_visible', 'sort', 'sort_order', 'status'));

      if (result.sort && !this.structure.get(result.sort)) {
        result.sort_order = result.sort = undefined;
      }

      // preferences normally trump filters, this is an edge case
      // @todo fix the data structure to make this logic less wierd
      if (this.filters.hasOwnProperty('columns_visible')) {
        result.columns_visible = this.filters.columns_visible;
      }

      return result;
    },

    updateActiveCount: function(diff) {
      if(!this.table.has('active')) {
        return;
      }

      switch (this.getFilter('status')) {
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

    canFetchMore: function () {
      return !this.fetching && this.getFilter('currentPage') + 1 < (this.getTotalCount() / this.getFilter('perPage'));
    },

    fetchNext: function () {
      this.filters.currentPage++;
      this.fetching = true;

      var xhr = this.fetch({remove: false});

      xhr.done(_.bind(function () {
        this.fetching = false;
      }, this));

      return xhr;
    },

    saveAll: function(options) {
      return this.save(this.models, options);
    },

    save: function(models, options) {
      options = options || {};
      var originalURL = this.url;
      var collection = this;
      var method = options.patch ? 'patch' : 'update';
      var success = options.success;
      var primaryColumnName = this.table.getPrimaryColumnName();

      // if there's not models set
      // get all the collection models
      if (!models) {
        models = collection.models;
      }

      if (method === 'patch') {
        if (_.isArray(options.attributes) && _.indexOf(options.attributes, primaryColumnName) < 0) {
          options.attributes.push(primaryColumnName);
        }

        options.attrs = {rows: models.map(function(model) {
          var attrs = model;

          if (model instanceof Backbone.Model) {
            attrs = model.toJSON({changed: true});
          }

          // Only save the given attributes
          if (options.attributes) {
            attrs = _.pick(attrs, options.attributes);
          }

          return attrs;
        })};
      } else {
        // @note: to support the API expecting a all rows inside rows property.
        options.insideRows = true;
      }

      var sync = function (resp) {
        collection.trigger('sync', collection, resp, options);
      };

      options.success = function(resp) {
        if (options.wait) {
          sync(resp);
        }

        if (success) {
          success(collection, resp, options);
        }
      };

      this.url += '/bulk';
      var xhr = this.sync(method, this, options);
      this.url = originalURL;
      // @removed we need to wait on success
      // to trigger sync
      // -----------------------------------
      // This was removed due to a issue with sorting
      // On listing page.
      // It will save the sort correctly
      // But it will render with old values
      // but will stay as reference if something happen soon
      // and reveal the reason why it was here.
      // this.trigger('sync');
      // waiting should do the trick :)

      if (!options.wait) {
        sync();
      }

      return xhr;
    },

    destroy: function(models, options) {
      options || (options = {});
      var collection = this;
      var originalURL = this.url;
      var success = options.success;

      if (!models) {
        models = collection.models;
      }

      options.data = JSON.stringify({rows: models});
      options.contentType = 'application/json';

      var destroy = function(resp) {
        _.each(models, function(model) {
          if (!(model instanceof Backbone.Model)) {
            model = collection.get(model);
          }

          model.trigger('destroy', model, model.collection, options);
        });

        collection.trigger('destroy sync', collection, resp, options);
      };

      options.success = function(resp) {
        if (options.wait) {
          destroy(resp);
        }

        if (success) {
          success(collection, resp, options);
        }
      };

      this.url += '/bulk';
      var xhr = this.sync('delete', this, options);
      this.url = originalURL;

      if (!options.wait) {
        destroy();
      }

      return xhr;
    },

    destroyAll: function(options) {
      this.destroy(this.toJSON(), options);
    },

    clone: function (cloneOptions) {
      cloneOptions = cloneOptions || {};
      var whitelist = ['structure', 'table', 'privileges', 'preferences'];

      var options = {
        model: this.model,
        comparator: this.comparator,
        table: this.table,
        structure: this.structure,
        privileges: this.privileges,
        preferences: this.preferences,
        url: this.url,
        rowsPerPage: this.rowsPerPage
      };

      _.each(whitelist, function (property) {
        if (cloneOptions[property] === true) {
          options[property] = options[property].clone();
        }
      });

      return new this.constructor(this.models, options);
    },

    setFilter: function (key, value, options) {
      var attrs, preferencesHasChanged = false;

      if (key === null || typeof key === 'object') {
        attrs = key;
        options = value;
      } else {
        (attrs = {})[key] = value;
      }

      options = options || {};
      if (options.save === undefined) {
        options.save = true;
      }

      _.each(attrs, function(value, key) {
        if (this.preferences && this.preferences.has(key)) {
          preferencesHasChanged = true;
          this.preferences.set(key, value, {silent: true});
        } else {
          this.filters[key] = value;
        }
      },this);

      if (options.save && preferencesHasChanged) {
        this.preferences.save();
      }
    },

    hasColumn: function(columnName) {
      return this.structure.get(columnName) !== undefined;
    },

    hasPermission: function (permissionType) {
      return this.can(permissionType);
    },

    getFieldBlacklist: function (permission) {
      var fieldBlacklist = [];

      if (this.privileges) {
        // TODO: Add this into privilege method
        fieldBlacklist = this.privileges.get(permission + '_field_blacklist') || '';
        fieldBlacklist = Utils.parseCSV(fieldBlacklist);
      }

      return fieldBlacklist;
    },

    can: function (permission) {
      var privileges = this.privileges;

      return privileges ? privileges.can(permission) : false;
    },

    canView: function() {
      return this.can('view');
    },

    canEdit: function() {
      return this.can('edit');
    },

    canAdd: function() {
      return this.can('add')
    },

    canDelete: function() {
      return this.can('delete');
    },

    getWriteFieldBlacklist: function() {
      return this.getFieldBlacklist('write');
    },

    getReadFieldBlacklist: function() {
      return this.getFieldBlacklist('read');
    },

    isWriteBlacklisted: function(attribute) {
      return _.contains(this.getWriteFieldBlacklist(), attribute);
    },

    isReadBlacklisted: function(attribute) {
      return _.contains(this.getReadFieldBlacklist(), attribute);
    },

    updateFiltersFromPreferences: function () {
      if (this.preferences) {
        this.filters = _.extend(this.filters, this.preferences.getFilters());
      }
    },

    initialize: function (models, options) {
      this.structure = options.structure;
      this.privileges = options.privileges;
      this.preferences = options.preferences;
      this.table = options.table;
      this.filters = options.filters || {};

      if (options.rowsPerPage) {
        this.rowsPerPage = options.rowsPerPage;
      }

      if (this.preferences) {
        this.updateFiltersFromPreferences();
        this.listenTo(this.preferences, 'sync', this.updateFiltersFromPreferences);
      }

      this.url = options.url || this.table.get('url') + '/rows';

      this.active = this.table.get('active');

      this.filters = _.extend({
        currentPage: 0,
        perPage: this.rowsPerPage,
        sort: 'id',
        sort_order: 'ASC'
      }, this.filters);

      if (!this.structure.get(this.filters.sort)) {
        this.filters.sort = this.structure.at(0).get('column_name');
      }

      // do we got a sort column?
      // let sort it by that instead please
      var sortColumnName = this.table.getSortColumnName();
      if (this.structure.get(sortColumnName)) {
        this.filters['sort'] = sortColumnName;
      }

      this.filters['status'] = '1,2';

      if (!options.preferences) {
        options.preferences = new PreferenceModel();
      }

      this.preferences = options.preferences;
      this.preferences.on('change', function () {
        this.trigger('change');
      }, this);
    },

    getNewModelInstance: function (options) {
      options = _.extend({collection: this}, options || {});

      return new this.model({}, options);
    },

    getNewInstance: function (options) {
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

    parseHeaders: function (response) {
      if (_.isEmpty(response)) {
        return;
      }

      if (response.total !== undefined) {
        this.table.set('total', response.total, {silent: true});
      }

      if (response.total_entries) {
        this.table.set('total_entries', response.total_entries, {silent: true});
      }

      app.statusMapping.get(this.table.id, true).get('mapping').each(function (status) {
        if (response[status.get('name')]) {
          this.table.set(status.get('name'), response[status.get('name')], {silent: true});
        }
      }, this);
    },

    parse: function (response) {
      if (_.isEmpty(response)) {
        return;
      }

      // Parse table headers
      this.parseHeaders(response.meta);

      return response.data;
    },

    // // gets the table status information, otherwise global information will be used
    // getTableStatuses: function () {
    //   var table = this.getTable();
    //   var tableName = table ? table.id : '*';
    //
    //   return app.statusMapping.get(tableName);
    // },
    //
    // getTableStatusMapping: function () {
    //   var tableStatus = this.getTableStatuses();
    //
    //   return tableStatus.get('mapping');
    // },

    getTable: function () {
      return this.table;
    },

    constructor: function EntriesCollection (data, options) {
      EntriesCollection.__super__.constructor.call(this, data, options);
    }
  });

  _.extend(EntriesCollection.prototype, StatusMixin.Collection);
  _.extend(EntriesCollection.prototype, SaveCollectionMixin);
});
