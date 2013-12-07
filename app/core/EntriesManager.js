define(function(require, exports, module) {

  "use strict";

  var SchemaManager      = require('./../schema/SchemaManager'),
      EntriesCollection  = require('./entries/entries.collection');

  // Contains collections that should be persistent
  var usersInstance;
  var mediaInstance;
  var groupsInstance;
  var activityInstance;
  var messagesInstance;

  var apiURL = '',
      rowsPerPage = 100;

  function setup(options) {
    apiURL = options.apiURL;
    rowsPerPage = options.rowsPerPage;

    // Setup Directus Users
    usersInstance = new EntriesCollection([], _.extend({
      rowsPerPage: 3000,
      url: app.API_URL + 'tables/directus_users/rows',
      filters: {columns_visible: ['avatar', 'first_name', 'last_name', 'group', 'email', 'description']}
    }, SchemaManager.getFullSchema('directus_users')));

    mediaInstance = new EntriesCollection([], _.extend({
      rowsPerPage: rowsPerPage,
      url: app.API_URL + 'media',
      filters: {columns_visible: ['name','title','size','user','date_uploaded', 'storage_adapter']}
    }, SchemaManager.getFullSchema('directus_media')));

    activityInstance = new EntriesCollection([], _.extend({
      rowsPerPage: rowsPerPage,
      url: app.API_URL + 'activity/',
      filters: {columns_visible: ['activity','datetime','user'], sort_order: 'DESC'}
    }, SchemaManager.getFullSchema('directus_activity')));

    groupsInstance = new EntriesCollection([], _.extend({
      rowsPerPage: rowsPerPage,
      url: app.API_URL + 'groups/'
    }, SchemaManager.getFullSchema('directus_groups')));
  }

  function getInstance(tableName) {
    switch (tableName) {

      case 'directus_users':
        return usersInstance
        break;

      case 'directus_media':
        return mediaInstance;
        break;

      case 'directus_groups':
        return groupsInstance;
        break;

      case 'directus_activity':
        return activityInstance;
        break;
    }

    var defaultOptions = SchemaManager.getFullSchema(tableName);

    var entries = new EntriesCollection([], _.extend({
      rowsPerPage: rowsPerPage
    }, defaultOptions));

    return entries;

  }

  module.exports.getInstance = getInstance;
  module.exports.setup = setup;

});