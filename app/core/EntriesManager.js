define(function(require, exports, module) {

  "use strict";

  var SchemaManager      = require('./../schema/SchemaManager'),
      EntriesCollection  = require('./entries/EntriesCollection'),
      UsersCollection    = require('modules/users/UsersCollection'),
      GroupsCollection   = require('modules/settings/GroupsCollection'),
      FilesCollection    = require('modules/files/FilesCollection');

  // Contains collections that should be persistent
  var usersInstance;
  var filesInstance;
  var groupsInstance;
  var activityInstance;
  var tablesInstance;
  var messagesInstance;

  var apiURL = '',
      rowsPerPage = 100;

  function getNewCoreInstance(tableName) {
    switch (tableName) {
      case 'directus_users':
        return new UsersCollection([], _.extend({
          rowsPerPage: 3000,
          url: apiURL + 'users/',
          filters: {columns_visible: ['avatar', 'avatar_file_id', 'first_name', 'last_name', 'group', 'email', 'position', 'location', 'phone', 'last_access'], active:1}
        }, SchemaManager.getFullSchema('directus_users')));

      case 'directus_files':
        return new FilesCollection([], _.extend({
          rowsPerPage: rowsPerPage,
          url: apiURL + 'files',
          filters: {columns_visible: ['name','title','size', 'type', 'thumbnail_url', 'url', 'user','date_uploaded', 'storage_adapter', 'width', 'height']}
        }, SchemaManager.getFullSchema('directus_files')));

      case 'directus_tables':
        return new EntriesCollection([], _.extend({
          rowsPerPage: rowsPerPage,
          url: apiURL + 'tables'
        }, SchemaManager.getFullSchema('directus_tables')));

      case 'directus_groups':
        return new GroupsCollection([], _.extend({
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
    tablesInstance = getNewCoreInstance('directus_tables');
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

      case 'directus_tables':
        return newCoreInstance ? getNewCoreInstance(tableName) : tablesInstance;

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

  function updateRowsLimit(limit) {
    rowsPerPage = Number(limit);
  }

  module.exports.getInstance = getInstance;
  module.exports.getNewInstance = getNewInstance;
  module.exports.setup = setup;
  module.exports.updateRowsLimit = updateRowsLimit;

  module.exports.FilesCollection = FilesCollection;

});
