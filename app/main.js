
//  main.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
require(["config"], function() {
  require([
    "app",
    'core/UIManager',
    "router",
    "backbone",
    "alerts",
    "core/tabs",
    'modules/messages/messages',
    'plugins/alertify',
    'schema/SchemaManager',
    'modules/settings/collection',
    'core/ExtensionManager',
    'core/EntriesManager'
  ],

  function(app, UIManager, Router, Backbone, alerts, Tabs, Messages, alertify, SchemaManager, SettingsCollection, ExtensionManager, EntriesManager) {

    "use strict";

    var defaultOptions = {
      path: '/directus/',
      page: '',
      authenticatedUser: 7,
      groups: {},
      privileges: [],
      ui: [],
      active_media: {},
      users: {},
      extensions: [],
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

    var options = _.defaults(window.directusData, defaultOptions);

    // Setup global variables
    app.root = options.path;
    app.DEFAULT_VALIDATION_MESSAGE = 'The data you entered is not valid';
    app.API_URL = options.path + 'api/1/';
    app.RESOURCES_URL = '/resources/';
    app.PATH = options.path;

    // This needs elegance
    app.settings = new SettingsCollection(options.settings, {parse: true});
    app.settings.url = app.API_URL + 'settings';

    UIManager.setup();
    SchemaManager.setup({apiURL: app.API_URL});

    app.schemaManager = SchemaManager;


    // Load extenral UI / extensions
    $.when(
      UIManager.load(options.ui),
      ExtensionManager.load(options.extensions)

    ).done(function() {

      // Register UI schemas
      SchemaManager.registerUISchemas(UIManager.getAllSettings());

      // Register Table Schemas
      SchemaManager.register('tables', options.tables);

      // Register Preferences
      SchemaManager.registerPreferences(options.preferences);

      // Register Privileges
      SchemaManager.registerPrivileges(options.privileges);

      // Extend user schema with extra fields
      SchemaManager.getColumns('tables', 'directus_users').add(options.extendedUserColumns, {parse: true});

      EntriesManager.setup({
        apiURL: app.API_URL,
        rowsPerPage: parseInt(app.settings.get('global').get('rows_per_page'), 10)
      });

      ////////////////////////////////////////////////////////////////////////////////////
      // Setup global instances

      app.users    = EntriesManager.getInstance('directus_users');
      app.media    = EntriesManager.getInstance('directus_media');
      app.activity = EntriesManager.getInstance('directus_activity');
      app.groups   = EntriesManager.getInstance('directus_groups');

      // Proxy to EntriesManager
      app.getEntries = function(tableName, options) { return EntriesManager.getInstance(tableName, options); },

      app.messages = new Messages.Collection([], _.extend({
        url: app.API_URL + 'messages/rows/'
      }, SchemaManager.getFullSchema('directus_messages')));

      app.messages.on('error:polling', function() {
        alertify.error('Directus failed to communicate with the server.<br> A new attempt will be made in 30 seconds.');
      });

      app.messages.on('sync', function(collection, object) {
        if (object !== null && object.rows) {
          alertify.log('New Message');
        }
      });

      // Bootstrap data
      app.groups.reset(options.groups, {parse: true});
      app.users.reset(options.users, {parse: true});
      app.media.reset(options.active_media, {parse: true});
      app.messages.reset(options.messages, {parse: true});

      app.messages.startPolling();

      ////////////////////////////////////////////////////////////////////////////////////
      // Setup Tabs
      // Default directus tabs
      var tabs = [
        {title: "Activity", id: "activity", count: app.activity.table.get('active')},
        {title: "Tables",   id: "tables",   count: SchemaManager.countTables() },
        {title: "Media",    id: "media",    count: app.media.table.get('active')},
        {title: "Users",    id: "users",    count: app.users.table.get('active')},
        {title: "Settings", id: "settings"}
      ];

      var extensions = ExtensionManager.getIds();

      // Add extensions to tabs
      _.each(extensions, function(item) {
        tabs.push({title: app.capitalize(item), id: item, extension: true});
      });

      // Grab tab permissions from DB
      var tabPrivileges = options.tab_privileges;
      var tabBlacklist = (tabPrivileges.tab_blacklist || '').split(',');

      // Filter out blacklisted tabs
      tabs = _.filter(tabs, function(tab) {
        return !_.contains(tabBlacklist, tab.id);
      });

      // Turn into collection
      tabs = new Tabs.Collection(tabs);

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
      });

      // And js errors...
      window.onerror = function(message, file, line) {
        var type = 'JS';
        var details = 'Error: ' + message + '\nFile: ' + file + '\n Line:' + line;
        app.logErrorToServer(type, 'Error', details);
        app.trigger('alert:error', 'Error', details);
      };

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
});
