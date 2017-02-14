
//  main.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
require(["config", 'polyfills'], function() {

  require([
    'app',
    'underscore',
    'core/UIManager',
    'router',
    'backbone',
    'alerts',
    'core/t',
    'core/tabs',
    'core/bookmarks',
    'modules/messages/messages',
    'schema/SchemaManager',
    'modules/settings/SettingsCollection',
    'core/entries/EntriesModel',
    'core/ExtensionManager',
    'core/EntriesManager',
    'core/ListViewManager',
    'core/idle',
    'tool-tips',
    'contextual-date',
    'core/notification'
  ],

  function(app, _, UIManager, Router, Backbone, alerts, __t, Tabs, Bookmarks, Messages, SchemaManager, SettingsCollection, EntriesModel, ExtensionManager, EntriesManager, ListViewManager, Idle, ToolTip, ContextualDate, Notification) {

    "use strict";

    var defaultOptions = {
      locale: 'en',
      localesAvailable: [],
      timezone: 'America/New_York',
      // @TODO: Make timezone an object with id and name
      timezones: [],
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
      user_notifications: [],
      showWelcomeWindow: false,
      me: { id: 7 },
      settings: {
        global: {},
        files: {}
      },
      storage_adapters: {},
      // tab_privileges: {},
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
    app.API_URL = options.path + 'api/1.1/';
    app.RESOURCES_URL = '/resources/';
    app.PATH = options.path;
    app.authenticatedUserId = window.directusData.authenticatedUser;
    app.storageAdapters = window.directusData.storage_adapters;
    app.statusMapping = window.directusData.statusMapping;
    app.locale = options.locale;
    app.locales = options.localesAvailable;
    app.timezone = options.timezone;
    app.timezones = options.timezones;
    app.user_notifications = options.user_notifications;
    app.showWelcomeWindow = options.showWelcomeWindow;

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

    UIManager.setup();
    SchemaManager.setup({apiURL: app.API_URL});
    ListViewManager.setup();

    app.schemaManager = SchemaManager;

    // Load extenral UI / extensions
    $.when(
      UIManager.load(options.ui),
      ExtensionManager.load(options.extensions),
      ListViewManager.load(options.listViews)

    ).done(function() {

      // Register UI schemas
      SchemaManager.registerUISchemas(UIManager.getAllSettings());
      SchemaManager.addSettings(UIManager.getDirectusSettings());

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
        rowsPerPage: parseInt(options.config['rows_per_page'], 10)
      });

      ////////////////////////////////////////////////////////////////////////////////////
      // Setup global instances

      app.users    = EntriesManager.getInstance('directus_users');
      app.files    = EntriesManager.getInstance('directus_files');
      app.activity = EntriesManager.getInstance('directus_activity');
      app.groups   = EntriesManager.getInstance('directus_groups');
      app.settings = EntriesManager.getInstance('directus_settings');

      // Proxy to EntriesManager
      app.getEntries = function(tableName, options) { return EntriesManager.getInstance(tableName, options); };

      app.messages = new Messages.Collection([], _.extend({
        url: app.API_URL + 'messages/rows/'
      }, SchemaManager.getFullSchema('directus_messages')));

      app.messages.on('error:polling', function() {
        Notification.error('Directus can\'t reach the server', '<i>A new attempt will be made in 30 seconds</i>');
      });

      app.messages.on('sync', function(collection, object) {
        if (object !== null && object.data) {
          var messages = object.data;
          if (!_.isArray(messages)) {
            messages = [messages];
          }

          messages.forEach(function(msg) {
            var message_excerpt = (msg.message && msg.message.length > 50) ? msg.message.substr(0, 50) : msg.message;
            Notification.show('New Message — <i>' + msg.subject + '</i>', message_excerpt + '<br><br><i>View message</i>', {timeout: 5000,
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
      app.settings.reset(options.settings, {parse: true});
      app.messages.reset(options.messages, {parse: true});

      app.messages.startPolling();

      var autoLogoutMinutes = parseInt(app.settings.get('cms_user_auto_sign_out') || 60, 10);

      var waitForForAvtivity = function() {
        //console.log('minutes until automatic logout:', autoLogoutMinutes);

        Idle.start({
          timeout: function() {
            Notification.warning(null, 'You\'ve been inactive for ' + autoLogoutMinutes + ' minutes. You will be automatically logged out in 10 seconds');

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
        if(SchemaManager.getPrivileges(table.table_name)) {
        var privileges = SchemaManager.getPrivileges(table.table_name);
        if(privileges.get('allow_view') > 0 && !table.hidden && privileges.get('nav_listed') > 0) {
            bookmarks.push(new Backbone.Model({
              icon_class: '',
              title: app.capitalize(table.table_name),
              url: 'tables/' + encodeURIComponent(table.table_name),
              section: 'table'
            }));
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
          url: item.path,
          section: 'extension'
        }));
      });

      // Grab nav permissions
      var currentUserGroupId = app.users.getCurrentUser().get('group').get('id');
      var currentUserGroup = app.groups.get(currentUserGroupId);
      var navBlacklist = (currentUserGroup.get('nav_blacklist') || '').split(',');

      // Custom Bookmarks Nav
      var customBookmarks = [];
      if (currentUserGroup.get('nav_override') !== false) {
        for (var section in currentUserGroup.get('nav_override')) {
          var sectionItems = currentUserGroup.get('nav_override')[section]
          // @todo: check this is not a string, but a valid object.
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
        console.error("The nav override JSON for this user group is malformed – the default nav will be used instead");
      }

      var isCustomBookmarks = false;
      if(customBookmarks.length) {
        isCustomBookmarks = true;
        bookmarks = bookmarks.concat(customBookmarks);
      }

      // Filter out blacklisted bookmarks (case-sensitive)
      bookmarks = _.filter(bookmarks, function(bookmark) {
        return !_.contains(navBlacklist, bookmark.attributes.title);
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

        if (options.errorPropagation !== false) {
          options.error = errorCodeHandler;
        }

        // Force fix: https://github.com/RNGR/Directus/issues/776
        // when $.ajax global is false there's not global event fired
        // the code below wouldn't run on .ajaxSend
        // therefore we run it here

        if(options.global === false) {
          var url = '';
          var collection = {};

          if (model.url) {
            collection = model;
          } else if(model.collection) {
            collection = model.collection;
          }

          if(typeof collection.url === "function") {
            url = collection.url();
          } else {
            url = collection.url;
          }

          if (url) {
            var isApiRequest = url.substr(0, app.API_URL.length) === app.API_URL;
            if(isApiRequest) {
              nonce = nonces.pool.unshift();
              options.beforeSend = function(xhr) {
                xhr.setRequestHeader(nonces.nonce_request_header, nonce);
              };
              options.complete = function(xhr) {
                var new_nonces = xhr.getResponseHeader(nonces.nonce_response_header);
                if(new_nonces) {
                  new_nonces = new_nonces.split(',');
                  nonces.pool.push.apply(nonces.pool, new_nonces);
                }
              };
            }
          }
        }

        return sync(method, model, options);
      };

      // Toggle responsive navigation
      $(document).on("click", ".responsive-nav-toggle", function(e) {
        $('#main').toggleClass('sidebar-active');
        $('.invisible-blocker').toggleClass('sidebar-active');
      });

      // Close sidebar when clicking
      $(document).on("click", "#sidebar", function(e) {
        $('#main').removeClass('sidebar-active');
        $('.invisible-blocker').removeClass('sidebar-active');
      });

      // Cancel default file drop
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
      $(document).ajaxError(function(e, xhr, settings) {
        if (settings.errorPropagation === false) {
          return;
        }

        var type, messageTitle, messageBody, details;
        if (xhr.statusText === "abort") {
          return;
        }

        if (xhr.responseJSON) {
          messageBody = xhr.responseJSON.error;
        } else {
          messageBody = xhr.responseText;
        }

        switch (xhr.status) {
          case 404:
            messageTitle = __t('not_found');
            messageBody = __t('x_not_found', {what: 'URL'}) + '<br>' + settings.url;
            break;
          case 403:
            // var response = $.parseJSON(xhr.responseText);
            messageTitle = __t('restricted_access');
            // messageBody = "You don't have permission to access this table. Please send this to IT:<br>\n\n" + xhr.responseText;
            details = true;
            break;
          case 413:
            details = false;
            messageTitle = __t('max_file_size_exceeded_x_x', {
              size: app.settings.getMaxFileSize(),
              unit: app.settings.getMaxFileSizeUnit()
            });
            break;
          default:
            type = 'Server ' + xhr.status;
            messageTitle = __t('server_error');
            details = encodeURIComponent(xhr.responseText);

            if (_.isString(messageBody)) {
              try {
                messageBody = JSON.parse(messageBody);
              } catch (e) {
                // do nothing
              }
            }

            if (messageBody.message) {
              messageBody = messageBody.message;
              details = false;
            }

            // app.logErrorToServer(type, messageTitle, details);
            break;
        }

        app.trigger('alert:error', messageTitle, messageBody, details)
      });

      // And js errors...
      window.onerror = function(message, file, line) {
        var type = 'JS';
        var details = 'Error: ' + message + '\nFile: ' + file + '\n Line:' + line;
        // app.logErrorToServer(type, 'Error', details);
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
        var isApiRequest = settings.url.substr(0, app.API_URL.length) === app.API_URL;
        if(isApiRequest) {
          nonce = nonces.pool.unshift();
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


      app.router = new Router({extensions: extensions, tabs: tabs, navPrivileges: app.users.getCurrentUser().get('group')});

      // Trigger the initial route and enable HTML5 History API support, set the
      // root folder to '/' by default.  Change in app.js.
      Backbone.history.start({ pushState: true, root: app.root });

      // All navigation that is relative should be passed through the navigate
      // method, to be processed by the router. If the link has a `data-bypass`
      // attribute, bypass the delegation completely.
      $(document).on("click", "a[href]:not([data-bypass])", function(evt) {
        // Get the absolute anchor href.
        var href = {
          prop: $(this).prop('href'),
          attr: $(this).attr('href'),
          target: $(this).attr('target')
        };
        // Get the absolute root.
        var root = location.protocol + "//" + location.host + app.root;

        // Ensure the root is part of the anchor href, meaning it's relative.
        // @NOTE: We don't need to strictly check for "_blank".
        //        it needs to be case insensitive.
        var target = (href.target || '').toLowerCase();
        if (href.prop.slice(0, root.length) === root && target !== '_blank') {
          // Stop the default event to ensure the link will not cause a page
          // refresh.
          evt.preventDefault();

          // Don't follow empty links
          if (href.attr === '#') return;

          // Remove the directus sub-path from the anchor href
          // Backbone.history already have app.root as root.
          var path = (href.attr || '/');
          if (path.startsWith(app.root)) {
            path = path.slice(app.root.length);
          }

          // `Backbone.history.navigate` is sufficient for all Routers and will
          // trigger the correct events. The Router's internal `navigate` method
          // calls this anyways.  The fragment is sliced from the root.

          Backbone.history.navigate(path, true);
        }
      }).on('scroll', function(){
        // Fade in header shadow based on scroll position
        var windowScroll = Math.max(Math.min($(window).scrollTop(), 100), 0) / 100;
        $('#header-shadow').css({ opacity: windowScroll });
      });

      var toolTip = new ToolTip();
      toolTip.render();

      $(document).on('click', '.toggle-help-text', function(event) {
        var text = $(this).data('help-text');
        if (text) {
          app.router.openModal({type: 'alert', text: text});
        }
      });

    });

  });
});
