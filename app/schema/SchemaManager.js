define(function(require, exports, module) {

  "use strict";

  var app = require('app');

  // Structures
  var ColumnModel        = require('./ColumnModel'),
      ColumnsCollection  = require('./ColumnsCollection'),
      TableModel         = require('./TableModel'),
      UIModel            = require('./UIModel'),
      DirectusCollection = require('core/collection'),
      PreferenceModel    = require('core/PreferenceModel');

  // Static Schemas
  var directusSchemas = {
    'directus_activity'  : require('./fixed/activity'),
    'directus_groups'    : require('./fixed/groups'),
    'directus_files'     : require('./fixed/files'),
    'directus_messages'  : require('./fixed/messages'),
    'directus_users'     : require('./fixed/users')
  };

  /**
   * @private
   * Static Settings Schemas
   */
  var settingsSchemas = {
    'global': require('./fixed/settings.global'),
    'files': require('./fixed/settings.files')
  };

  /**
   * @private
   * Collection of MySQL Tables
   */
  var TableCollection = DirectusCollection.extend({
    model: TableModel,

    countVisible: function() {
      // Visible models only
      var models = this.filter(function(model) { return !model.get('hidden'); });

      return models.length;
    }
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

  module.exports = {

    setup: function(options) {
      this.apiURL = options.apiURL;


      var defaultTables = [
        { schema: directusSchemas.directus_activity },
        { schema: directusSchemas.directus_groups },
        { schema: directusSchemas.directus_files.getFiles() },
        { schema: directusSchemas.directus_messages },
        { schema: directusSchemas.directus_users.getUsers(app.locales) }
      ];

      this.register('tables', defaultTables);

      this.registerSettingsSchemas([
        {id: 'global', schema: settingsSchemas.global},
        {id: 'files', schema: settingsSchemas.files}
      ]);

    },

    register: function(namespace, tables) {
      _.each(tables, function(options) {
        var tableName = options.schema.id;

        if (tableSchemas[namespace].get(tableName)) {
          console.warn('Warning: ' + tableName + ' already exists in the schema manager, the schema will be ignored');
          return;
        }

        // Set table schema
        options.schema.url = this.apiURL + 'tables/' + encodeURIComponent(tableName);

        var model = new TableModel(options.schema, {parse: true, url: this.apiURL + 'tables/' + encodeURIComponent(tableName)});
        //model.url = this.apiURL + 'tables/' + tableName;
        //model.columns.url = this.apiURL + 'tables/' + tableName + '/columns';

        columnSchemas[namespace][tableName] = model.columns;
        tableSchemas[namespace].add(model);

      }, this);
    },

    registerColumns: function(namespace, tableName, columns) {
      columnSchemas[namespace][tableName] = columns;
    },

    // Registers the UI variables as schemas so they can be
    // used as forms in the table settings
    registerUISchemas: function(data) {
      var namespace = 'ui';
      _.each(data, function(ui) {
        columnSchemas[namespace][ui.id] = new ColumnsCollection(ui.variables, {parse: true});
      }, this);
    },

    // Registers static schemas for the global and files settings
    registerSettingsSchemas: function(data) {
      var namespace = 'settings';
      _.each(data, function(settings) {
        columnSchemas[namespace][settings.id] = new ColumnsCollection(settings.schema.structure, {parse: true});
        // TODO: columns must have its table information
        columnSchemas[namespace][settings.id].table = {
          id: 'directus_settings'
        };
      }, this);
    },

    addSetting: function(collection, data) {
      var settingsCollection = columnSchemas['settings'][collection];
      settingsCollection.add(new ColumnModel(data, {parse: true}));
    },

    addSettings: function(settings) {
      _.each(settings, function(setting) {
        if (!setting.collection) {
          console.warn('Settings must have a collection name.');
          return;
        }

        this.addSetting(setting.collection, _.omit(setting, 'collection'));
      }, this);
    },

    // Registers user preferences for tables (sort, visible columns etc)
    registerPreferences: function(data) {
      _.each(data, function(preference) {
        var add = "";
        if(preference.title !== null)
        {
          add = ":" + preference.title;
        }
        preferences[preference.table_name + add] = new PreferenceModel(preference, {url: this.apiURL + 'tables/' + encodeURIComponent(preference.table_name) + '/preferences'});
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

    getTables: function() {
      return tableSchemas.tables;
    },

    getPrivileges: function(tableName) {
      return privileges[tableName];
    },

    updatePrivileges: function(tableName, attributes) {
      var tablePrivileges = this.getPrivileges(tableName);
      if(tablePrivileges) {
        tablePrivileges.set(attributes);
      }
    },

    countTables: function() {
      return tableSchemas.tables.countVisible();
    },

    getFullSchema: function(tableName) {
      if (!tableSchemas.tables.get(tableName)) {
        throw "Table `"+ tableName +"` does not exist";
      }
      return {
        table: tableSchemas.tables.get(tableName),
        structure: columnSchemas.tables[tableName],
        preferences: preferences[tableName],
        privileges: privileges[tableName]
      };
    },

    unregisterFullSchema: function(tableName) {
        tableSchemas.tables.remove(tableName);
        delete columnSchemas.tables[tableName];
        delete preferences[tableName];
        delete privileges[tableName];
    },

    getEntriesInstance: function(tableName) {

    }

  };

});
