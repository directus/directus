define(function(require, exports, module) {

  "use strict";

  // Structures
  var ColumnModel = require('./column.model'),
      ColumnsCollection = require('./columns.collection'),
      TableModel = require('./table.model'),
      UIModel = require('./ui.model');

  // Static Schemas
  var directusSchemas = {
    'directus_activity': require('./fixed/activity'),
    'directus_groups': require('./fixed/groups'),
    'directus_media': require('./fixed/media'),
    'directus_messages': require('./fixed/messages'),
    'directus_users': require('./fixed/users')
  }
  // Static Settings Schemas
  var settingsSchemas = {
    'global': require('./fixed/messages'),
    'media': require('./fixed/users')
  }

  var Schema = module.exports = function() {
    this._tableSchemas = new Backbone.Collection();

    this._columnSchemas = {};
    this._uiSchemas = {};
    this._settingsSchemas = {};

    var defaultTables = [
      { schema: _.extend({columns: directusSchemas['directus_activity'].structure}, directusSchemas['directus_activity'].table) },
      { schema: _.extend({columns: directusSchemas['directus_groups'].structure}, directusSchemas['directus_groups'].table)  },
      { schema: _.extend({columns: directusSchemas['directus_media'].structure}, directusSchemas['directus_media'].table) },
      { schema: _.extend({columns: directusSchemas['directus_messages'].structure}, directusSchemas['directus_messages'].table) },
      { schema: _.extend({columns: directusSchemas['directus_users'].structure}, directusSchemas['directus_users'].table) }
    ];

    this.registerSchemas(defaultTables);

    console.log(this);
  };

  Schema.prototype.registerSchemas = function(tables) {
    _.each(tables, function(options) {

      var tableName = options.schema.id;

      // Set table schema
      options.schema.url = app.API_URL + 'tables/' + tableName;

      var model = new TableModel(options.schema, {parse: true});
      model.url = app.API_URL + 'tables/' + tableName;
      model.columns.url = app.API_URL + 'tables/' + tableName + '/columns';
      model.columns.table = model;

      this._columnSchemas[tableName] = model.columns;
      this._tableSchemas.add(model);

    }, this);
  }

  Schema.prototype.registerUISchemas = function(data) {
    _.each(data, function(ui) {
      this._uiSchemas[ui.id] = new ColumnsCollection(ui.settings, {parse: true});
    }, this);
  }

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