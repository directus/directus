define(function(require, exports, module) {

  "use strict";

  var SchemaManager      = require('./../schema/SchemaManager'),
      EntriesCollection  = require('./entries/EntriesCollection'),
      UsersCollection    = require('modules/users/UsersCollection'),
      SettingsCollection = require('modules/settings/SettingsCollection'),
      FilesCollection    = require('modules/files/FilesCollection');

  // Contains collections that should be persistent
  var usersInstance;
  var filesInstance;
  var groupsInstance;
  var activityInstance;
  var settingsInstance;
  var messagesInstance;

  var apiURL = '',
      rowsPerPage = 100;

  function getNewCoreInstance(tableName) {
    switch (tableName) {
      case 'directus_users':
        return new UsersCollection([], _.extend({
          rowsPerPage: 3000,
          url: apiURL + 'tables/directus_users/rows',
          filters: {columns_visible: ['avatar', 'first_name', 'last_name', 'group', 'email', 'position', 'location', 'phone', 'last_access'], active:1}
        }, SchemaManager.getFullSchema('directus_users')));

      case 'directus_files':
        return new FilesCollection([], _.extend({
          rowsPerPage: rowsPerPage,
          url: apiURL + 'files',
          filters: {columns_visible: ['name','title','size', 'type', 'url', 'user','date_uploaded', 'storage_adapter', 'width', 'height']}
        }, SchemaManager.getFullSchema('directus_files')));

      case 'directus_settings':
        return new SettingsCollection([], _.extend({
          rowsPerPage: rowsPerPage,
          url: apiURL + 'settings'
        }, SchemaManager.getFullSchema('directus_settings')));

      case 'directus_groups':
        return new EntriesCollection([], _.extend({
          rowsPerPage: rowsPerPage,
          url: apiURL + 'groups/'
        }, SchemaManager.getFullSchema('directus_groups')));

      case 'directus_activity':
        return new EntriesCollection([], _.extend({
          rowsPerPage: rowsPerPage,
          url: apiURL + 'activity/',
          filters: {columns_visible: ['activity','datetime','user'], sort_order: 'DESC'}
        }, SchemaManager.getFullSchema('directus_activity')));
    }
  }

  function setup(options) {
    apiURL = options.apiURL;
    rowsPerPage = options.rowsPerPage;

    // Setup Directus Users
    usersInstance = getNewCoreInstance('directus_users');
    filesInstance = getNewCoreInstance('directus_files');
    activityInstance = getNewCoreInstance('directus_activity');
    settingsInstance = getNewCoreInstance('directus_settings');
    groupsInstance = getNewCoreInstance('directus_groups');
  }

  function getInstance(tableName, options) {
    options = (options || {});
    var newCoreInstance = options.getNewInstance === true;

    switch (tableName) {
      case 'directus_users':
        return newCoreInstance ? getNewCoreInstance(tableName) : usersInstance;

      case 'directus_files':
        return newCoreInstance ? getNewCoreInstance(tableName) : filesInstance;

      case 'directus_settings':
        return newCoreInstance ? getNewCoreInstance(tableName) : settingsInstance;

      case 'directus_groups':
        return newCoreInstance ? getNewCoreInstance(tableName) : groupsInstance;

      case 'directus_activity':
        return newCoreInstance ? getNewCoreInstance(tableName) : activityInstance;
    }

    options = options || {};

    var defaultOptions = _.extend(SchemaManager.getFullSchema(tableName), options);

    if (defaultOptions.privileges === undefined) {
      throw "You lack privileges for `"+ tableName +"`";
    }

    var entries = new EntriesCollection([], _.extend({
      rowsPerPage: rowsPerPage
    }, defaultOptions));

    return entries;

  }

  // @TODO: A better separation of this two methods
  function getNewInstance(tableName, options) {
    options = (options || {});
    options.getNewInstance = true;
    return getInstance(tableName, options);
  }

  module.exports.getInstance = getInstance;
  module.exports.getNewInstance = getNewInstance;
  module.exports.setup = setup;

  module.exports.FilesCollection = FilesCollection;

});
