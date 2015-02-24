
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
    "core/bookmarks",
    'modules/messages/messages',
    'schema/SchemaManager',
    'modules/settings/SettingsCollection',
    'core/ExtensionManager',
    'core/EntriesManager',
    'core/ListViewManager',
    'core/idle',
    'tool-tips',
    'noty'
  ],

  function(app, UIManager, Router, Backbone, alerts, Tabs, Bookmarks, Messages, SchemaManager, SettingsCollection, ExtensionManager, EntriesManager, ListViewManager, Idle, ToolTip) {

    "use strict";

    var defaultOptions = {
      path: '/directus/',
      page: '',
      authenticatedUser: 7,
      groups: {},
      privileges: [],
      ui: [],
      active_files: {},
      users: {},
      bookmarks: {},
      extensions: [],
      messages: {},
      me: { id: 7 },
      settings: {
        global: {},
        files: {}
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
    app.DEFAULT_VALIDATION_MESSAGE = 'Invalid content...';
    app.API_URL = options.path + 'api/1/';
    app.RESOURCES_URL = '/resources/';
    app.PATH = options.path;
    app.authenticatedUserId = window.directusData.authenticatedUser;
    app.storageAdapters = window.directusData.storage_adapters;
    app.statusMapping = window.directusData.statusMapping;

    $.xhrPool = []; // array of uncompleted requests
    $.xhrPool.abortAll = function() { // our abort function
        $(this).each(function(idx, jqXHR) {
            jqXHR.abort();
        });
        $.xhrPool.length = 0;
    };

    $.ajaxSetup({
        beforeSend: function(jqXHR) { // before jQuery send the request we will push it to our array
            $.xhrPool.push(jqXHR);
        },
        complete: function(jqXHR) { // when some of the requests completed it will splice from the array
            var index = $.xhrPool.indexOf(jqXHR);
            if (index > -1) {
                $.xhrPool.splice(index, 1);
            }
        }
    });

    // This needs elegance
    app.settings = new SettingsCollection(options.settings, {parse: true});
    app.settings.url = app.API_URL + 'settings';

    UIManager.setup();
    SchemaManager.setup({apiURL: app.API_URL});

    app.schemaManager = SchemaManager;

    // Load extenral UI / extensions
    $.when(
      UIManager.load(options.ui),
      ExtensionManager.load(options.extensions),
      ListViewManager.load(options.listViews)

    ).done(function() {

      var autoLogoutMinutes = parseInt(app.settings.get('global').get('cms_user_auto_sign_out') || 60, 10);

      var waitForForAvtivity = function() {
        //console.log('minutes until automatic logout:', autoLogoutMinutes);

        Idle.start({
          timeout: function() {
            noty({text: 'You\'ve been inactive for ' + autoLogoutMinutes + ' minutes. You will be automatically logged out in 10 seconds', type: 'warning', layout:'bottomRight', theme: 'directus'});

            //Wait for another 10 seconds before kicking the user out
            Idle.start({
              timeout: function() {
                app.logOut(true);
              },
              interrupt: waitForForAvtivity,
              delay: 10000,
              repeat: false
            });

          },
          delay: autoLogoutMinutes * 60 * 1000,
          repeat: true
        });

      };

      waitForForAvtivity();

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
      app.files    = EntriesManager.getInstance('directus_files');
      app.activity = EntriesManager.getInstance('directus_activity');
      app.groups   = EntriesManager.getInstance('directus_groups');

      // Proxy to EntriesManager
      app.getEntries = function(tableName, options) { return EntriesManager.getInstance(tableName, options); };

      app.messages = new Messages.Collection([], _.extend({
        url: app.API_URL + 'messages/rows/'
      }, SchemaManager.getFullSchema('directus_messages')));

      app.messages.on('error:polling', function() {
        noty({text: '<b>Directus can\'t reach the server</b><br><i>A new attempt will be made in 30 seconds</i>', type: 'error', layout:'bottomRight', theme: 'directus'});
      });

      app.messages.on('sync', function(collection, object) {
        if (object !== null && object.rows) {
          object.rows.forEach(function(msg) {
            noty({text: '<b>New Message — <i>' + msg.subject + '</i></b><br>' + msg.responses.models[msg.responses.models.length-1].attributes.message + '<br><br><i>View message</i>', layout:'bottomRight', timeout: 5000, theme: 'directus',
              callback: {
                onCloseClick: function() {
                  Backbone.history.navigate('/messages/' + msg.id, true);
                }
              }
            });
          });
        }
      });

      // Bootstrap data
      app.groups.reset(options.groups, {parse: true});
      app.users.reset(options.users, {parse: true});
      app.files.reset(options.active_files, {parse: true});
      app.messages.reset(options.messages, {parse: true});

      app.messages.startPolling();


      ////////////////////////////////////////////////////////////////////////////////////
      // Bind Progress Functions To App

      app.showProgressNotification = function(message) {
        alerts.showProgressNotification(message);
      };

      app.hideProgressNotification = function() {
        alerts.hideProgressNotification();
      };

      $('#page-blocker').fadeOut(0);

      ////////////////////////////////////////////////////////////////////////////////////
      // Setup Tabs @TODO: REMOVE
      // Default directus tabs

      var tabs = [
        {id: "users/" + app.users.getCurrentUser().get("id"), icon_class: "icon-pencil", avatar: ''},
        {id: "logout", icon_class: "icon-power-button"}
      ];

      if(app.users.getCurrentUser().get('group').id === 1) {
        tabs.unshift();
      }

      ////////////////////////////////////////////////////////////////////////////////////
      // Setup Bookmarks
      ////////////////////////////////////////////////////////////////////////////////////
      var bookmarks = [];
      options.tables.forEach(function(table) {
        table = table.schema;

        if(SchemaManager.getPrivileges(table.table_name) && SchemaManager.getPrivileges(table.table_name).get('permissions')) {
        var permissions = SchemaManager.getPrivileges(table.table_name).get('permissions').split(',');
        if(permissions.indexOf('view') !== -1 || permissions.indexOf('bigview') !== -1) {
          if(!table.hidden) {
            bookmarks.push(new Backbone.Model({
              icon_class: '',
              title: app.capitalize(table.table_name),
              url: 'tables/' + table.table_name,
              section: 'table'
            }));
          }
        }
        }
      });

      var bookmarksData = window.directusData.bookmarks;
      _.each(bookmarksData, function(bookmark) {
        bookmarks.push(new Backbone.Model(bookmark));
      });

      var extensions = ExtensionManager.getIds();

      // Add extensions to bookmarks
      _.each(extensions, function(item) {
        item = ExtensionManager.getInfo(item);
        bookmarks.push(new Backbone.Model({
          icon_class: item.icon,
          title: item.title,
          url: item.id,
          section: 'extension'
        }));
      });

      // Grab tab permissions from DB
      var tabPrivileges = options.tab_privileges;
      var tabBlacklist = (tabPrivileges.tab_blacklist || '').split(',');

      // Custom Bookmarks Nav
      var customBookmarks = [];
      if (tabPrivileges.nav_override !== false) {
        for(var section in tabPrivileges.nav_override) {
          var sectionItems = tabPrivileges.nav_override[section];
          for(var item in sectionItems) {
            var path = sectionItems[item].path || '';
            customBookmarks.push(new Backbone.Model({
              icon_class: item.icon,
              title: item,
              url: path,
              section: section
            }));
          }
        }
      } else {
        console.log("The nav override JSON for this user group is malformed – the default nav will be used instead");
      }

      var isCustomBookmarks = false;
      if(customBookmarks.length) {
        isCustomBookmarks = true;
        bookmarks = bookmarks.concat(customBookmarks);
      }

      // Filter out blacklisted bookmarks (case-sensitive)
      bookmarks = _.filter(bookmarks, function(bookmark) {
        return !_.contains(tabBlacklist, bookmark.attributes.title);
      });

      // Turn into collection
      tabs = new Tabs.Collection(tabs);

      app.bookmarks = new Bookmarks.Collection(bookmarks, {isCustomBookmarks: isCustomBookmarks});

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
      $(document).on('ajaxStart.directus', function(e) {
        app.trigger('progress');
      });

      $(document).on('ajaxStop.directus', function(e) {
        app.trigger('load');
      });

      // Capture sync errors...
      $(document).ajaxError(function(e, xhr) {
        var type, message, details;
        if(xhr.statusText == "abort") {
          return;
        }
        switch(xhr.status) {
          case 403:
            // var response = $.parseJSON(xhr.responseText);
            message = "You don't have permission to access this table. Please send this to IT:<br>\n\n" + xhr.responseText;
            app.trigger("alert:error", "Restricted Access", message, true);
            break;
          default:
            type = 'Server ' + xhr.status;
            message = "Server Error";
            details = encodeURIComponent(xhr.responseText);
            app.logErrorToServer(type, message, details);
            if(xhr.responseJSON) {
              app.trigger("alert:error", "Server Error", xhr.responseJSON.message);
            } else {
              app.trigger("alert:error", "Server Error", xhr.responseText);
            }
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


      app.router = new Router({extensions: extensions, tabs: tabs, tabPrivileges: options.tab_privileges});

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
      }).on('scroll', function(){
        // Fade in header shadow based on scroll position
        var windowScroll = Math.max(Math.min($(window).scrollTop(), 100), 0) / 100;
        $('#header-shadow').css({ opacity: windowScroll });
      });

      var toolTip = new ToolTip();
      toolTip.render();

    });

  });
});
