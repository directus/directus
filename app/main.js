
//  main.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

require([
  "module",
  "app",
  "router",
  "backbone",
  "helpers",
  "core/directus",
  "core/ui",
  "schemas/media",
  "schemas/users",
  "schemas/activity",
  "schemas/groups",
  "schemas/messages",
  "schemas/settings.global",
  "schemas/settings.media",
  "alerts",
  "core/tabs",
  'modules/messages/messages',
  'plugins/alertify'
],

function(module, app, Router, Backbone, HandlebarsHelpers, Directus, UI, media, users, activity, groups, messages, SettingsGlobalSchema, SettingsMediaSchema, alerts, Tabs, Messages, alertify) {

  "use strict";

  window.directusData = window.directusData || {};

  var defaultBootstrapData = {
      path: '/directus/',
      page: '',
      authenticatedUser: 7,
      groups: {},
      privileges: [],
      ui: [],
      active_media: {},
      users: {},
      messages: {},
      me: { id: 7 },
      settings: {
        global: {},
        media: {}
      },
      storage_adapters: {},
      tab_privileges: {},
      preferences: [],
      tables: [],
      nonces: {
        pool: [],
        nonce_pool_size: 10,
        nonce_request_header: "X-Directus-Request-Nonce",
        nonce_response_header: "X-Directus-New-Request-Nonces"
      }
    };

    //////////////////////////////////////////////////////////////////////////////
    // This block is for extending the user table with custom fields

    // Find users table
    var directusUsers = _.find(window.directusData.tables, function(item) {
      return item.schema.id === 'directus_users';
    });

    var directusUsersColumns = directusUsers.schema.columns;
    var defaultUserColumns = _.pluck(users.structure, 'id');

    // Add non default columns
    _.each(directusUsersColumns, function(item) {
      if (!_.contains(defaultUserColumns, item.id)) {
        users.structure.push(item);
      }
    });

    //////////////////////////////////////////////////////////////////////////////

    var defaultTables = [
      { schema: _.extend({columns: media.structure}, media.table) },
      // @todo: for now we are ignoring the static user schema since we are extending it
      // with custom fields, eventually we should merge static and custom data.
      { schema: _.extend({columns: messages.structure}, messages.table)  },
      { schema: _.extend({columns: users.structure}, users.table) },
      { schema: _.extend({columns: activity.structure}, activity.table) },
      { schema: _.extend({columns: groups.structure}, groups.table) }
    ];

    // default bootstrap data global storage
    window.directusData = _.defaults(window.directusData, defaultBootstrapData);
    window.directusData.tables = _.union(window.directusData.tables, defaultTables);

    // Dynamically load extensions
    var extensionPaths = window.directusData.extensions || [];

    // Dynamically load ui's
    var uiPaths = window.directusData.ui || [];

    // Merge the two so everything can be loaded in one go
    var externalDependencies = extensionPaths.concat(uiPaths);

    require(externalDependencies, function() {

      var params = _.values(arguments);

      // Unpack extensions as the first part of the array
      var extensions = params.slice(0, extensionPaths.length);

      // Unpack extenal ui's as the second part
      var uis = params.slice(extensionPaths.length, externalDependencies.length);

      // @todo This has to be nicer! Make a setter
      UI.core = _.union(UI.core, uis);

      //////////////////////////////////////////////////////////////////////////////
      //Override backbone sync for custom error handling
      var sync = Backbone.sync;

      Backbone.sync = function(method, model, options) {

        var existingErrorHandler = function(){};
        if(undefined !== options.error)
          existingErrorHandler = options.error;

        var errorCodeHandler = function(xhr, status, thrown) {
          //@todo: note that status is getting overwritten. don't!
          status = xhr.status;

          existingErrorHandler(xhr, status, thrown);

          switch(status) {
            case 404:
              app.router.notFound();
              break;
            case 401:
              window.location = app.root;
              break;
            case 500:
              break;
          }
        };

        options.error = errorCodeHandler;

        sync(method, model, options);
      };

      //Cancel default file drop
      $(document).on('drop dragover', function(e) {
        e.preventDefault();
      });

      $(document).on('mousewheel DOMMouseScroll', function(e) {
        if (app.noScroll && event.target.nodeName !== 'TEXTAREA') {
          e.preventDefault();
        }
      });

      //Cancel default CMD + S;
      $(window).keydown(_.bind(function(e) {
        if (e.keyCode === 83 && e.metaKey) {
          e.preventDefault();
        }
      }, this));

      // Bootstrap global data
      var data = window.directusData;

      app.root = data.path;

      app.DEFAULT_VALIDATION_MESSAGE = 'The data you entered is not valid';
      app.API_URL = data.path + 'api/1/';
      app.RESOURCES_URL = '/resources/';
      app.PATH = data.path;
      app.uiSettings = UI.settings();
      app.columns = {};
      app.entries = {};
      app.privileges = {};
      app.preferences = {};
      app.tables = new Directus.Collection([], {filters: {columns: ['table_name','comment','active','date_modified','single'], conditions: {hidden: false, is_junction_table: false}}} );
      app.settings = new Directus.Settings(data.settings, {parse: true});
      app.settings.url = app.API_URL + 'settings';

      //@todo: move these event handlers to alerts.js
      $(document).ajaxStart(function(e) {
        app.trigger('progress');
      });

      $(document).ajaxStop(function(e) {
        app.trigger('load');
      });

      // Capture sync errors...
      $(document).ajaxError(function(e, xhr) {
        var type, message, details;

        switch(xhr.status) {
          case 403:
            app.trigger("alert:error", "Unauthorized", xhr.responseText);
            break;
          default:
            type = 'Server ' + xhr.status;
            message = "Server Error";
            details = encodeURIComponent(xhr.responseText);
            app.logErrorToServer(type, message, details);
            app.trigger("alert:error", "Server Error", xhr.responseText);
            break;
        }

        //details = 'xxx';
      });

      // And js errors...
      window.onerror = function(message, file, line) {
        var type = 'JS';
        var details = 'Error: ' + message + '\nFile: ' + file + '\n Line:' + line;
        app.logErrorToServer(type, 'Error', details);
        app.trigger('alert:error', 'Error', details);
      };
      // ---


      /**
       * Add nonce to API requests using custom request header
       *
       * @todo  modularize this logic
       */
      var nonces = window.directusData.nonces,
          nonce;

      $(document).ajaxSend(function(event, jqXHR, settings) {
        var isApiRequest = settings.url.substr(0, app.API_URL.length) == app.API_URL;
        if(isApiRequest) {
          nonce = nonces.pool.pop();
          jqXHR.setRequestHeader(nonces.nonce_request_header, nonce);
          // console.log('Using a nonce. New pool size: ' + nonces.pool.length);
        }
      });

      /**
       * Pull in new nonces from response headers
       */

      $(document).ajaxSuccess(function(event, xhr, settings) {
        var new_nonces = xhr.getResponseHeader(nonces.nonce_response_header);
        if(new_nonces) {
          new_nonces = new_nonces.split(',');
          // console.log('Got ' + new_nonces.length + ' new nonces:', new_nonces);
          // console.log('Old nonce pool size: ' + nonces.pool.length);
          nonces.pool.push.apply(nonces.pool, new_nonces);
          // console.log('New nonce pool size: ' + nonces.pool.length);
        }
      });

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Instantiate UI settings first
      _.each(app.uiSettings, function(value, key) {
        if (value.variables === undefined) return;
        //Deep-clone settings!
        var deepClone = app.deepClone(value.variables);
        app.uiSettings[key].schema = new Directus.CollectionColumns(deepClone, {parse: true});
      });

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Always bootstrap schema and table info.

      _.each(data.tables, function(options) {

        var tableName = options.schema.id;

        // Set table schema
        options.schema.url = app.API_URL + 'tables/' + tableName;

        var model = new Directus.TableModel(options.schema, {parse: true});
        model.url = app.API_URL + 'tables/' + tableName;
        model.columns.url = app.API_URL + 'tables/' + tableName + '/columns';
        model.columns.table = model;

        app.columns[tableName] = model.columns;
        app.tables.add(model);

      });

      // Set user preferences
      _.each(data.preferences, function(data) {
        var tableName = data.table_name;
        app.preferences[tableName] = new Backbone.Model(data);
        app.preferences[tableName].url = app.API_URL + 'tables/' + tableName + '/preferences';
      });

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Instantiate privileges
      var myPrivileges = data.privileges;
      _.each(myPrivileges, function(item) {
        var tableName = item.table_name;
        app.privileges[tableName] = new Backbone.Model(item,{parse:true});
      });

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Setup Global & Media settings
      app.settings.get('global').structure = new Directus.CollectionColumns(SettingsGlobalSchema.structure,{parse: true});
      app.settings.get('media').structure = new Directus.CollectionColumns(SettingsMediaSchema.structure,{parse: true});

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Setup core data collections.

      // @todo: Maybe do this earlier?


      app.users = new Directus.EntriesCollection([], {
        table: app.tables.get('directus_users'),
        structure: app.columns.directus_users,
        preferences: app.preferences.directus_users,
        url: app.API_URL + 'tables/directus_users/rows',
        filters: {columns_visible: ['avatar', 'first_name', 'last_name', 'group', 'email', 'description']},
        privileges: app.privileges.directus_users,
        rowsPerPage: 3000
      });

      app.media =
      app.entries.directus_media = new Directus.EntriesCollection([], {
        rowsPerPage: parseInt(app.settings.get('global').get('rows_per_page'),10),
        table: app.tables.get('directus_media'),
        structure: app.columns.directus_media,
        preferences: app.preferences.directus_media,
        url: app.API_URL + 'media',
        privileges: app.privileges.directus_media,
        filters: {columns_visible: ['name','title','size','user','date_uploaded', 'storage_adapter']}
      });

      app.activity = new Directus.EntriesCollection([], {
        rowsPerPage: parseInt(app.settings.get('global').get('rows_per_page'),10),
        table: app.tables.get('directus_activity'),
        structure: app.columns.directus_activity,
        url: app.API_URL + 'activity/',
        privileges: app.privileges.directus_activity,
        filters: {columns_visible: ['activity','datetime','user'], sort_order: 'DESC'}
      });

      app.groups =
      app.entries.directus_groups = new Directus.EntriesCollection([], {
        rowsPerPage: parseInt(app.settings.get('global').get('rows_per_page'),10),
        table: app.tables.get('directus_groups'),
        preferences: new Backbone.Model(groups.preferences),
        structure: app.columns.directus_groups,
        url: app.API_URL + 'groups/',
        privileges: app.privileges.directus_groups
      });

      app.messages =
      app.entries.directus_messages = new Messages.Collection([], {
        rowsPerPage: parseInt(app.settings.get('global').get('rows_per_page'),10),
        table: app.tables.get('directus_messages'),
        structure: app.columns.directus_messages,
        privileges: app.privileges.directus_messages,
        //preferences: app.preferences.directus_messages,
        url: app.API_URL + 'messages/rows/',
        filters: {columns_visible: ['from','subject','date_updated'], sort: 'date_updated', sort_order: 'DESC'}
      });

      app.messages.on('error:polling', function() {
        alertify.error('Directus failed to communicate with the server.<br> A new attempt will be made in 30 seconds.');
      });

      app.messages.on('sync', function(collection, object) {
          if (object !== null && object.rows) {
            alertify.log('New Message');
          }
      });

      app.messages.startPolling();

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Instantiate entries

      /*
      Trying to get rid of this...
      app.tables.each(function(table) {
        if (table.id.substring(0,9) === 'directus_') return;
        app.entries[table.id] = new Directus.EntriesCollection([], {
          rowsPerPage: parseInt(app.settings.get('global').get('rows_per_page'),10),
          structure: app.columns[table.id],
          table: table,
          preferences: app.preferences[table.id],
          privileges: app.privileges[table.id]
        });
      }, this);
      */

      // Lazy way to solve a HUGE problem
      app.EntriesCollection = Directus.EntriesCollection;

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Tabs

      // Instantiate tab permissions
      // @todo: make sure db is only returning one row

      // Default directus tabs
      var tabs = [
        {title: "Activity", id: "activity", count: app.activity.table.get('active')},
        {title: "Tables",   id: "tables",   count: app.tables.getRows().length},
        {title: "Media",    id: "media",    count: app.media.table.get('active')},
        {title: "Users",    id: "users",    count: app.users.table.get('active')},
        {title: "Settings", id: "settings"}
      ];

      var dada = window.directusData.extensions[0];

      // require(["extensions/binder"], function(binder) {
        // console.log(binder);
      // });
      //console.log(require('binder'));

      // Add extensions to tabs
      _.each(extensions, function(item) {
        tabs.push({title: app.capitalize(item.id), id: item.id, extension: true});
      });

      // Grab tab permissions from DB
      var tabPrivileges = data.tab_privileges;
      var tabBlacklist = (tabPrivileges.tab_blacklist || '').split(',');

      // Filter out blacklisted tabs
      tabs = _.filter(tabs, function(tab) {
        return !_.contains(tabBlacklist, tab.id);
      });

      // Turn into collection
      tabs = new Tabs.Collection(tabs);

      // Bootstrap data
      app.groups.reset(data.groups, {parse: true});
      app.users.reset(data.users, {parse: true});
      app.media.reset(data.active_media, {parse: true});
      app.messages.reset(data.messages, {parse: true});

      app.router = new Router({extensions: extensions, tabs: tabs});

      // Trigger the initial route and enable HTML5 History API support, set the
      // root folder to '/' by default.  Change in app.js.
      Backbone.history.start({ pushState: true, root: app.root });

      // All navigation that is relative should be passed through the navigate
      // method, to be processed by the router. If the link has a `data-bypass`
      // attribute, bypass the delegation completely.
      $(document).on("click", "a[href]:not([data-bypass])", function(evt) {
        // Get the absolute anchor href.
        var href = { prop: $(this).prop("href"), attr: $(this).attr("href") };
        // Get the absolute root.
        var root = location.protocol + "//" + location.host + app.root;

        // Ensure the root is part of the anchor href, meaning it's relative.
        if (href.prop.slice(0, root.length) === root) {
          // Stop the default event to ensure the link will not cause a page
          // refresh.
          evt.preventDefault();

          // Don't follow empty links
          if (href.attr === '#') return;

          // `Backbone.history.navigate` is sufficient for all Routers and will
          // trigger the correct events. The Router's internal `navigate` method
          // calls this anyways.  The fragment is sliced from the root.

          Backbone.history.navigate(href.attr, true);
        }
      });
    });
});
