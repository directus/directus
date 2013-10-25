define(function(require, exports, module) {

  "use strict";

  var app = require('app');

  // Structures
  var ColumnModel = require('./column.model'),
      ColumnsCollection = require('./columns.collection'),
      TableModel = require('./table.model'),
      UIModel = require('./ui.model'),
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

  var Schema = module.exports = function() {

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

  Schema.prototype.register = function(namespace, tables) {
    _.each(tables, function(options) {

      var tableName = options.schema.id;

      if (this._tableSchemas[namespace].get(tableName)) {
        console.warn('Warning: ' + tableName + ' allready exists in the schema manager, the schema will be ignored');
        return;
      }

      // Set table schema
      options.schema.url = app.API_URL + 'tables/' + tableName;

      var model = new TableModel(options.schema, {parse: true});
      model.url = app.API_URL + 'tables/' + tableName;
      model.columns.url = app.API_URL + 'tables/' + tableName + '/columns';
      model.columns.table = model;

      this._columnSchemas[namespace][tableName] = model.columns;
      this._tableSchemas[namespace].add(model);

    }, this);
  };

  Schema.prototype.registerUISchemas = function(data) {
    var namespace = 'ui';
    _.each(data, function(ui) {
      this._columnSchemas[namespace][ui.id] = new ColumnsCollection(ui.variables, {parse: true});
    }, this);
  };

  Schema.prototype.registerSettingsSchemas = function(data) {
    var namespace = 'settings';
    _.each(data, function(settings) {
      this._columnSchemas[namespace][settings.id] = new ColumnsCollection(settings.schema.structure, {parse: true});
    }, this);
  };

  Schema.prototype.registerPreferences = function(data) {
    _.each(data, function(preference) {
      this._preferences[preference.table_name] = new Backbone.Model(preference, {url: app.API_URL + 'tables/' + preference.table_name + '/preferences'});
    }, this);
  };

  Schema.prototype.registerPrivileges = function(data) {
    _.each(data, function(privilege) {
      this._privileges[privilege.table_name] = new Backbone.Model(privilege, {parse:true});
    }, this);
  };

  Schema.prototype.getColumns = function(namespace, tableName) {
    return this._columnSchemas[namespace][tableName];
  };

  Schema.prototype.getTable = function(tableName) {
    return this._tableSchemas.tables.get(tableName);
  };

  Schema.prototype.getTables = function(tableName) {
    return this._tableSchemas.tables;
  };

  Schema.prototype.getPrivileges = function(tableName) {
    return this._privileges[tableName];
  };

  Schema.prototype.countTables = function() {
    return this._tableSchemas.tables.length;
  };

  Schema.prototype.getFullSchema = function(tableName) {
    return {
      table: this._tableSchemas.tables.get(tableName),
      structure: this._columnSchemas.tables[tableName],
      preferences: this._preferences[tableName],
      privileges: this._privileges[tableName]
    };
  };

/*
  Schema = {
    ColumnModel: require('./column.model'),
    ColumnsCollection: require('./columns.collection'),
    TableModel: require('./table.model'),
    UIModel: require('./ui.model')
  }

  // Static Schemas
*/
});