define(function(require, exports, module) {

  "use strict";

  // Structures
  var ColumnModel = require('./ColumnModel'),
      ColumnsCollection = require('./ColumnsCollection'),
      TableModel = require('./TableModel'),
      UIModel = require('./UIModel'),
      DirectusCollection = require('core/collection');

  // Static Schemas
  var directusSchemas = {
    'directus_activity': require('./fixed/activity'),
    'directus_groups': require('./fixed/groups'),
    'directus_media': require('./fixed/media'),
    'directus_messages': require('./fixed/messages'),
    'directus_users': require('./fixed/users')
  };
  // Static Settings Schemas
  var settingsSchemas = {
    'global': require('./fixed/settings.global'),
    'media': require('./fixed/settings.media')
  };

  var SchemaManager = module.exports = function SchemaManager(options) {

    this.apiURL = options.apiURL;

    var TableCollection = DirectusCollection.extend({
      model: TableModel
    });

    this._tableSchemas = {
      tables: new TableCollection([], {
        filters: {
          columns: ['table_name','comment','active','date_modified','single'], 
          conditions: {hidden: false, is_junction_table: false}
        }
      })
    };

    this._columnSchemas = {
      tables: {},
      settings: {},
      ui: {}
    };

    this._preferences = {};
    this._privileges = {};

    var defaultTables = [
      { schema: _.extend({columns: directusSchemas['directus_activity'].structure}, directusSchemas['directus_activity'].table) },
      { schema: _.extend({columns: directusSchemas['directus_groups'].structure}, directusSchemas['directus_groups'].table)  },
      { schema: _.extend({columns: directusSchemas['directus_media'].structure}, directusSchemas['directus_media'].table) },
      { schema: _.extend({columns: directusSchemas['directus_messages'].structure}, directusSchemas['directus_messages'].table) },
      { schema: _.extend({columns: directusSchemas['directus_users'].structure}, directusSchemas['directus_users'].table) }
    ];

    this.register('tables', defaultTables);

    this.registerSettingsSchemas([
      {id: 'global', schema: settingsSchemas.global},
      {id: 'media', schema: settingsSchemas.media}
    ]);
  };

  _.extend(SchemaManager.prototype, {

    register: function(namespace, tables) {
      _.each(tables, function(options) {

        var tableName = options.schema.id;

        if (this._tableSchemas[namespace].get(tableName)) {
          console.warn('Warning: ' + tableName + ' allready exists in the schema manager, the schema will be ignored');
          return;
        }

        // Set table schema
        options.schema.url = this.apiURL + 'tables/' + tableName;

        var model = new TableModel(options.schema, {parse: true});
        model.url = this.apiURL + 'tables/' + tableName;
        model.columns.url = this.apiURL + 'tables/' + tableName + '/columns';
        model.columns.table = model;

        this._columnSchemas[namespace][tableName] = model.columns;
        this._tableSchemas[namespace].add(model);

      }, this);
    },

    // Registers the UI variables as schemas so they can be
    // used as forms in the table settings
    registerUISchemas: function(data) {
      var namespace = 'ui';
      _.each(data, function(ui) {
        this._columnSchemas[namespace][ui.id] = new ColumnsCollection(ui.variables, {parse: true});
      }, this);
    },

    // Registers static schemas for the global and media settings
    registerSettingsSchemas: function(data) {
      var namespace = 'settings';
      _.each(data, function(settings) {
        this._columnSchemas[namespace][settings.id] = new ColumnsCollection(settings.schema.structure, {parse: true});
      }, this);
    },

    // Registers user preferences for tables (sort, visible columns etc)
    registerPreferences: function(data) {
      _.each(data, function(preference) {
        this._preferences[preference.table_name] = new Backbone.Model(preference, {url: this.apiURL + 'tables/' + preference.table_name + '/preferences'});
      }, this);
    },

    // Registers user priviliges
    registerPrivileges: function(data) {
      _.each(data, function(privilege) {
        this._privileges[privilege.table_name] = new Backbone.Model(privilege, {parse:true});
      }, this);
    },

    getColumns: function(namespace, tableName) {
      return this._columnSchemas[namespace][tableName];
    },

    getTable: function(tableName) {
      return this._tableSchemas.tables.get(tableName);
    },

    getTables: function(tableName) {
      return this._tableSchemas.tables;
    },

    getPrivileges: function(tableName) {
      return this._privileges[tableName];
    },

    countTables: function() {
      return this._tableSchemas.tables.length;
    },

    getFullSchema: function(tableName) {
      return {
        table: this._tableSchemas.tables.get(tableName),
        structure: this._columnSchemas.tables[tableName],
        preferences: this._preferences[tableName],
        privileges: this._privileges[tableName]
      };
    },

    getEntriesInstance: function(tableName) {

    }

  });

});