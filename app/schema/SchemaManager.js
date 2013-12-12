define(function(require, exports, module) {

  "use strict";

  // Structures
  var ColumnModel        = require('./ColumnModel'),
      ColumnsCollection  = require('./ColumnsCollection'),
      TableModel         = require('./TableModel'),
      UIModel            = require('./UIModel'),
      DirectusCollection = require('core/collection');

  // Static Schemas
  var directusSchemas = {
    'directus_activity'  : require('./fixed/activity'),
    'directus_groups'    : require('./fixed/groups'),
    'directus_media'     : require('./fixed/media'),
    'directus_messages'  : require('./fixed/messages'),
    'directus_users'     : require('./fixed/users')
  };

  /**
   * @private
   * Static Settings Schemas
   */
  var settingsSchemas = {
    'global': require('./fixed/settings.global'),
    'media': require('./fixed/settings.media')
  };

  /**
   * @private
   * Collection of MySQL Tables
   */
  var TableCollection = DirectusCollection.extend({
    model: TableModel
  });

  /**
   * @private
   * Holds schemas of all tables in the database
   */
  var tableSchemas = {
    tables: new TableCollection([], {
      filters: {
        columns: ['table_name','comment','active','date_modified','single'],
        conditions: {hidden: false, is_junction_table: false}
      }
    })
  };

  /**
   * @private
   * Holds schemas of all columns in the database
   */
  var columnSchemas = {
    tables: {},
    settings: {},
    ui: {}
  };

  /**
   * @private
   * Holds preferences
   */
  var preferences = {};

  /**
   * @private
   * Holds privileges
   */
  var privileges = {};

  /**
   * @private
   * Holds defaualt table configurations
   */
  var defaultTables = [
    { schema: directusSchemas['directus_activity'] },
    { schema: directusSchemas['directus_groups'] },
    { schema: directusSchemas['directus_media'] },
    { schema: directusSchemas['directus_messages'] },
    { schema: directusSchemas['directus_users'] }
  ];

  module.exports = {

    setup: function(options) {
      this.apiURL = options.apiURL;

      this.register('tables', defaultTables);

      this.registerSettingsSchemas([
        {id: 'global', schema: settingsSchemas.global},
        {id: 'media', schema: settingsSchemas.media}
      ]);

    },

    register: function(namespace, tables) {
      _.each(tables, function(options) {

        var tableName = options.schema.id;

        if (tableSchemas[namespace].get(tableName)) {
          console.warn('Warning: ' + tableName + ' allready exists in the schema manager, the schema will be ignored');
          return;
        }

        // Set table schema
        options.schema.url = this.apiURL + 'tables/' + tableName;

        var model = new TableModel(options.schema, {parse: true});
        model.url = this.apiURL + 'tables/' + tableName;
        model.columns.url = this.apiURL + 'tables/' + tableName + '/columns';
        model.columns.table = model;

        columnSchemas[namespace][tableName] = model.columns;
        tableSchemas[namespace].add(model);

      }, this);
    },

    // Registers the UI variables as schemas so they can be
    // used as forms in the table settings
    registerUISchemas: function(data) {
      var namespace = 'ui';
      _.each(data, function(ui) {
        columnSchemas[namespace][ui.id] = new ColumnsCollection(ui.variables, {parse: true});
      }, this);
    },

    // Registers static schemas for the global and media settings
    registerSettingsSchemas: function(data) {
      var namespace = 'settings';
      _.each(data, function(settings) {
        columnSchemas[namespace][settings.id] = new ColumnsCollection(settings.schema.structure, {parse: true});
      }, this);
    },

    // Registers user preferences for tables (sort, visible columns etc)
    registerPreferences: function(data) {
      _.each(data, function(preference) {
        preferences[preference.table_name] = new Backbone.Model(preference, {url: this.apiURL + 'tables/' + preference.table_name + '/preferences'});
      }, this);
    },

    // Registers user priviliges
    registerPrivileges: function(data) {
      _.each(data, function(privilege) {
        privileges[privilege.table_name] = new Backbone.Model(privilege, {parse:true});
      }, this);
    },

    getColumns: function(namespace, tableName) {
      return columnSchemas[namespace][tableName];
    },

    getTable: function(tableName) {
      return tableSchemas.tables.get(tableName);
    },

    getTables: function(tableName) {
      return tableSchemas.tables;
    },

    getPrivileges: function(tableName) {
      return privileges[tableName];
    },

    countTables: function() {
      return tableSchemas.tables.length;
    },

    getFullSchema: function(tableName) {
      if (!tableSchemas.tables.get(tableName)) {
        throw "Table `"+ tableName +"` does not exist";
      };
      return {
        table: tableSchemas.tables.get(tableName),
        structure: columnSchemas.tables[tableName],
        preferences: preferences[tableName],
        privileges: privileges[tableName]
      };
    },

    getEntriesInstance: function(tableName) {

    }

  };

});