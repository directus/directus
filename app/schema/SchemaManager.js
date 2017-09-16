define(function(require, exports, module) {
  'use strict';

  var app = require('app');
  var _   = require('underscore');

  // Structures
  var ColumnModel        = require('./ColumnModel'),
      PrivilegeModel     = require('./PrivilegeModel'),
      ColumnsCollection  = require('./ColumnsCollection'),
      TableModel         = require('./TableModel'),
      FakeTableModel     = require('./FakeTableModel'),
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
  var defaultPrivileges = new PrivilegeModel({}, {
    parse: true
  });

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

    getUserTables: function () {
      return _.filter(this.models, function (model) {
        return (model.id || '').indexOf('directus_') !== 0;
      });
    },

    countVisible: function() {
      // Visible models only
      var models = this.filter(function(model) { return !model.get('hidden'); });

      return models.length;
    },

    constructor: function TableCollection() {
      return DirectusCollection.prototype.constructor.apply(this, arguments);
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
        { schema: directusSchemas.directus_users.getUsers(app.locales, app.timezones, app.countries) }
      ];

      this.register('tables', defaultTables);

      this.registerSettingsSchemas([
        {id: 'global', schema: settingsSchemas.global},
        {id: 'files', schema: settingsSchemas.files}
      ]);

    },

    register: function (namespace, tables) {
      if (!_.isArray(tables)) {
        tables = [tables];
      }

      _.each(tables, function (options) {
        var tableName = options.schema.id;
        var model;

        if (tableSchemas[namespace].get(tableName)) {
          console.warn('Warning: ' + tableName + ' already exists in the schema manager, the schema will be ignored');
          return;
        }

        // Set table schema
        options.schema.url = this.apiURL + 'tables/' + encodeURIComponent(tableName);

        model = this.createTableModel(tableName, options.schema);

        columnSchemas[namespace][tableName] = model.columns;
        tableSchemas[namespace].add(model);
      }, this);
    },

    registerTable: function (tables) {
      return this.register('tables', tables);
    },

    // Create a table model from table schema data
    createTableModel: function (tableName, schema) {
      //model.url = this.apiURL + 'tables/' + tableName;
      //model.columns.url = this.apiURL + 'tables/' + tableName + '/columns';

      return new TableModel(schema, {
        parse: true,
        url: this.apiURL + 'tables/' + encodeURIComponent(tableName)
      });
    },

    registerColumns: function(namespace, tableName, columns) {
      columnSchemas[namespace][tableName] = columns;
    },

    // Registers the UI variables as schemas so they can be
    // used as forms in the table settings
    registerUISchemas: function(data) {
      var namespace = 'ui';

      _.each(data, function (ui) {
        // Interfaces schema does not have a actual table
        // we fake it to use their variables/settings as if they were columns
        var table = new FakeTableModel();
        var columns = new ColumnsCollection(ui.options || ui.variables, {
          parse: true,
          table: table
        });

        table.columns = columnSchemas[namespace][ui.id] = columns;
      }, this);
    },

    // Registers static schemas for the global and files settings
    registerSettingsSchemas: function(data) {
      var namespace = 'settings';

      _.each(data, function (settings) {
        // TODO: columns must have its table information
        var fakeTable = new FakeTableModel({
          id: 'directus_settings'
        });

        var columns = new ColumnsCollection(settings.schema.columns, {
          parse: true,
          table: fakeTable
        });

        fakeTable.columns = columnSchemas[namespace][settings.id] = columns;
      }, this);
    },

    addTableWithSystemColumns: function (tableName, columnsName, fn) {
      this.addTable(tableName, fn, columnsName);
    },

    addTable: function(tableName, callback, columnsName) {
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
        addTable: true,
        columnsName: columnsName
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
    registerPreferences: function (data) {
      _.each(data, function (preference) {
        var add = '';

        if(preference.title !== null) {
          add = ':' + preference.title;
        }

        preferences[preference.table_name + add] = new PreferenceModel(preference, {
          // TODO: Move this into the preference model
          // and do some back flip when the table is not defined yet
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

    getColumns: function(namespace, tableName, clone) {
      var columns = columnSchemas[namespace][tableName];

      if (clone === true) {
        columns = new columns.constructor(columns.models, {
          table: columns.table
        });
      }

      return columns;
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

    getBookmarkPreferences: function (title) {
      var preference = new PreferenceModel();

      preference.url = this.apiURL + 'bookmarks/' + encodeURIComponent(title) + '/preferences';

      return preference.fetch({});
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
