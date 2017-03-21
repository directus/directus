define(function(require, exports, module) {

  'use strict';

  var app = require('app');
  var _   = require('underscore');

  // Structures
  var ColumnModel        = require('./ColumnModel'),
      PrivilegeModel     = require('./PrivilegeModel'),
      ColumnsCollection  = require('./ColumnsCollection'),
      TableModel         = require('./TableModel'),
      DirectusCollection = require('core/collection'),
      PreferenceModel    = require('core/PreferenceModel');

  // Static Schemas
  var directusSchemas = {
    'directus_activity'  : require('./fixed/activity'),
    'directus_columns'    : require('./fixed/columns'),
    'directus_groups'    : require('./fixed/groups'),
    'directus_files'     : require('./fixed/files'),
    'directus_messages'  : require('./fixed/messages'),
    'directus_privileges'  : require('./fixed/privileges'),
    'directus_tables'    : require('./fixed/tables'),
    'directus_users'     : require('./fixed/users')
  };

  /**
   * @private
   * Static Settings Schemas
   */
  var settingsSchemas = require('./fixed/settings');

  /**
   * @private
   * Default Privileges
   */
  var defaultPrivileges = new PrivilegeModel({}, {parse:true});

  /**
   * @private
   * Collection of MySQL Tables
   */
  var TableCollection = DirectusCollection.extend({
    model: TableModel,

    comparator: function (model) {
      var level = hasPrivilege(model.id) ? 0 : 1;

      return level + ' ' + model.get('table_name');
    },

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
        columns: ['table_name','comment','status','date_modified','single'],
        conditions: {hidden: false}
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

  var getPrivileges = function (tableName, statusId) {
    statusId = statusId == null ? 'all' : statusId;

    return _.findStringKey(privileges, tableName + '.' + statusId);
  };

  var hasPrivilege = function (table) {
    // Filter out tables you don't have alter permissions on
    var privileges = getPrivileges(table);

    // filter out tables with empty privileges
    if (privileges === undefined) return false;

    // only return tables with view permissions
    return privileges.has('allow_view') && privileges.get('allow_view') > 0;
  };

  module.exports = {

    setup: function(options) {
      this.apiURL = options.apiURL;


      var defaultTables = [
        { schema: directusSchemas.directus_activity },
        { schema: directusSchemas.directus_columns },
        { schema: directusSchemas.directus_groups },
        { schema: directusSchemas.directus_files.getFiles() },
        { schema: directusSchemas.directus_messages },
        { schema: directusSchemas.directus_privileges },
        { schema: directusSchemas.directus_tables },
        { schema: directusSchemas.directus_users.getUsers(app.locales, app.timezones) }
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
        columnSchemas[namespace][settings.id] = new ColumnsCollection(settings.schema.columns, {parse: true});
        // TODO: columns must have its table information
        columnSchemas[namespace][settings.id].table = {
          id: 'directus_settings'
        };
      }, this);
    },

    addTable: function(tableName, callback) {
      // @todo: set default values in the server side
      var model = new PrivilegeModel({
        group_id: 1,
        allow_add:1,
        allow_edit:2,
        allow_delete:2,
        allow_alter:1,
        allow_view:2,
        table_name: tableName,
        nav_listed: 1,
        addTable: true
      });
      // hotfix: creating/adding a table is done by adding its privileges
      // if addTable is set to true it creates the table
      model.url = app.API_URL + 'privileges/1';

      var self = this;
      model.save({}, {success: function(permission) {
        self.registerPrivileges([permission.toJSON()]);
        app.schemaManager.getOrFetchTable(tableName, function(table) {
          callback(table);
        });
      }});
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
        preferences[preference.table_name + add] = new PreferenceModel(preference, {
          url: this.apiURL + 'tables/' + encodeURIComponent(preference.table_name) + '/preferences',
          parse: true
        });
      }, this);
    },

    // Registers user priviliges
    registerPrivileges: function(data) {
      _.each(data, function(privilege) {
        var statusId = privilege.status_id == null ? 'all' : privilege.status_id;
        var model;

        if (!privileges[privilege.table_name]) {
          privileges[privilege.table_name] = {};
        }

        if (!privileges[privilege.table_name][statusId]) {
          privileges[privilege.table_name][statusId] = new PrivilegeModel();
        }

        model = privileges[privilege.table_name][statusId];
        // hotfix: parse data
        model.set(privilege.data ? privilege.data : privilege);
      }, this);
    },

    hasPrivilege: function (table) {
      return hasPrivilege(table);
    },

    getColumns: function(namespace, tableName) {
      return columnSchemas[namespace][tableName];
    },

    getSettingsSchemas: function () {
      return columnSchemas['settings'];
    },

    getTable: function(tableName) {
      return tableSchemas.tables.get(tableName);
    },

    getOrFetchTable: function(tableName, callback) {
      var tableModel = this.getTable(tableName);
      var tablePreferences = this.getPreferences(tableName);
      var tablePrivileges = this.getPrivileges(tableName);

      if (tableModel && tablePreferences && tablePrivileges) {
        return callback(tableModel);
      }

      tableModel = new TableModel({
        id: tableName,
        table_name: tableName
      }, {
        parse: true,
        url: app.API_URL + 'tables/' + tableName
      });

      var self = this;
      tableModel.fetch({
        success: function(model) {
          self.register('tables', [{schema: tableModel.toJSON()}]);
          self.registerPreferences([tableModel.preferences.toJSON()]);
          callback(model);
        }
      });
    },

    getTables: function() {
      return tableSchemas.tables;
    },

    getPrivileges: function(tableName, statusId) {
      return getPrivileges(tableName, statusId);
    },

    getPrivilegesOrDefault: function(tableName, statusId) {
      return this.getPrivileges(tableName, statusId) || defaultPrivileges.clone();
    },

    getDefaultPrivileges: function(table, statusId) {
      // statusId can be 0, which translate to false as well
      if (!statusId && statusId !== 0) {
        statusId = null;
      }

      var model = defaultPrivileges.clone();

      model.set('status_id', statusId);
      model.set('table_name', table);

      return model;
    },

    getPreferences: function(tableName) {
      return preferences[tableName];
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
        privileges: this.getPrivileges(tableName)
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
