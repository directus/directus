
//  main.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
require(['config', 'polyfills'], function () {
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
    'core/extensions',
    'core/CustomUIView',
    'core/ExtensionManager',
    'core/EntriesManager',
    'core/ListViewManager',
    'core/status/status-table-collection',
    'core/idle',
    'ext/moment-timeago',
    'contextual-date',
    'core/notification'
  ], function (app, _, UIManager, Router, Backbone, alerts, __t, Tabs, Bookmarks, Messages, SchemaManager, SettingsCollection, EntriesModel, Extension, CustomUIView, ExtensionManager, EntriesManager, ListViewManager, StatusTableCollection, Idle, moment, ContextualDate, Notification) {

    'use strict';

    var defaultOptions = {
      locale: 'en',
      localesAvailable: [],
      timezone: 'America/New_York',
      // @TODO: Make timezone an object with id and name
      timezones: [],
      countries: [],
      http: {},
      cors: {},
      path: '/directus/',
      page: '',
      authenticatedUser: 0, // 0 = guest, sort of :)
      groups: {},
      privileges: [],
      interfaces: [],
      default_interfaces: {},
      active_files: {},
      users: {},
      user: {},
      bookmarks: {},
      extensions: [],
      messages: {},
      user_notifications: [],
      showWelcomeWindow: false,
      // TODO: Change this to a model (alias to a new account/user object)
      me: { id: null },
      settings: {
        global: {},
        files: {}
      },
      storage_adapters: {},
      preferences: [],
      tables: []
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
    app.statusMapping = new StatusTableCollection(window.directusData.statusMapping, {parse: true});
    app.locale = options.locale;
    app.locales = options.localesAvailable;
    app.timezone = options.timezone;
    app.timezones = options.timezones;
    app.countries = options.countries;
    app.user_notifications = options.user_notifications;
    app.showWelcomeWindow = options.showWelcomeWindow;
    // TODO: Make the options part of the app internally
    app.options = options;

    $.xhrPool = []; // array of uncompleted requests
    $.xhrPool.abortAll = function () { // our abort function
        $(this).each(function (idx, jqXHR) {
            jqXHR.abort();
        });
        $.xhrPool.length = 0;
    };

    $.ajaxSetup({
        beforeSend: function (jqXHR) { // before jQuery send the request we will push it to our array
            $.xhrPool.push(jqXHR);
        },
        complete: function (jqXHR) { // when some of the requests completed it will splice from the array
            var index = $.xhrPool.indexOf(jqXHR);
            if (index > -1) {
                $.xhrPool.splice(index, 1);
            }
        }
    });

    moment.locale(options.locale);

    UIManager.setup();
    UIManager.setDefaultInterfaces(options.default_interfaces);
    SchemaManager.setup({apiURL: app.API_URL});
    ListViewManager.setup();

    app.schemaManager = SchemaManager;

    // Load extenral UI / extensions
    $.when(
      UIManager.load(options.interfaces),
      ExtensionManager.load(options.extensions),
      ListViewManager.load(options.listViews)
    ).done(function () {

      app.trigger('loaded');

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
      if (options.extendedUserColumns) {
        SchemaManager.getColumns('tables', 'directus_users').add(
          options.extendedUserColumns,
          {parse: true}
        );
      }

      // Extend files schema with extra fields
      if (options.extendedFilesColumns) {
        SchemaManager.getColumns('tables', 'directus_files').add(
          options.extendedFilesColumns,
          {parse: true}
        );
      }

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

      // This needs elegance
      app.settings = new SettingsCollection(options.settings, {parse: true});
      app.settings.url = app.API_URL + 'settings';

      // Proxy to EntriesManager
      app.getEntries = function (tableName, options) {
        return EntriesManager.getInstance(tableName, options);
      };

      app.messages = new Messages.Collection([], _.extend({
        url: app.API_URL + 'messages/rows'
      }, SchemaManager.getFullSchema('directus_messages')));

      // Bootstrap data
      app.groups.reset(options.groups, {parse: true});
      app.users.reset(options.users, {parse: true});
      app.messages.reset(options.messages, {parse: true});
      app.user = new app.users.model(options.user, _.extend({
        // NOTE: the model has not url set, we need to set based on the users collection
        urlRoot: app.users.url,
        parse: true
      }, SchemaManager.getFullSchema('directus_users')));

      if (app.user.canReadMessages()) {
        app.startMessagesPolling();
      }

      app.users.on('change sync', function (collection, resp, options) {
        var authenticatedUserModel = collection;

        // NOTE: Some `change` events has empty collection parameter, fix it!
        if (!authenticatedUserModel) {
          return;
        }

        if (authenticatedUserModel instanceof Backbone.Collection) {
          authenticatedUserModel = authenticatedUserModel.get(app.user.id, false);
        }

        if (authenticatedUserModel && authenticatedUserModel.id === app.user.id) {
          app.user.set(_.clone(authenticatedUserModel.attributes));
        }
      });

      var autoLogoutMinutes = parseInt(app.settings.get('cms_user_auto_sign_out') || 60, 10);

      var waitForForActivity = function() {
        // console.log('minutes until automatic logout:', autoLogoutMinutes);
        Idle.start({
          timeout: function () {
            Notification.warning(null, 'You\'ve been inactive for ' + autoLogoutMinutes + ' minutes. You will be automatically logged out in 10 seconds');

            //Wait for another 10 seconds before kicking the user out
            Idle.start({
              timeout: function () {
                app.logOut(true, true);
              },
              interrupt: waitForForActivity,
              delay: 10000,
              repeat: false
            });

          },
          delay: autoLogoutMinutes * 60 * 1000,
          repeat: true
        });

      };

      waitForForActivity();

      ////////////////////////////////////////////////////////////////////////////////////
      // Bind Progress Functions To App

      app.showProgressNotification = function (message) {
        alerts.showProgressNotification(message);
      };

      app.hideProgressNotification = function () {
        alerts.hideProgressNotification();
      };

      ////////////////////////////////////////////////////////////////////////////////////
      // Setup Tabs @TODO: REMOVE
      // Default directus tabs

      var tabs = [
        {id: 'users/' + app.user.id, avatar: ''},
        {id: 'logout'}
      ];

      if (app.user.get('group').id === 1) {
        tabs.unshift();
      }

      ////////////////////////////////////////////////////////////////////////////////////
      // Setup Bookmarks
      ////////////////////////////////////////////////////////////////////////////////////
      var bookmarks = [];

      options.tables.forEach(function (table) {
        table = table.schema;
        if (SchemaManager.getPrivileges(table.table_name)) {
          var privileges = SchemaManager.getPrivileges(table.table_name);

          if (table.hidden !== true && privileges.canView() && privileges.canBeListed()) {
            bookmarks.push({
              identifier: table.table_name,
              title: app.capitalize(table.table_name),
              url: 'tables/' + encodeURIComponent(table.table_name),
              section: 'table'
            });
          }
        }
      });

      var bookmarksData = window.directusData.bookmarks;
      _.each(bookmarksData, function (bookmark) {
        bookmark.identifier = bookmark.title;
        bookmarks.push(bookmark);
      });

      var extensions = ExtensionManager.getIds();

      // Add extensions to bookmarks
      _.each(extensions, function (item) {
        item = ExtensionManager.getInfo(item);
        bookmarks.push({
          identifier: item.id,
          title: item.title,
          url: item.path,
          section: 'extension'
        });
      });

      // Grab nav permissions
      var currentUserGroupId = app.user.get('group').get('id');
      var currentUserGroup = app.groups.get(currentUserGroupId);
      var navBlacklist = currentUserGroup.getNavBlacklist();

      // Custom Bookmarks Nav
      var customBookmarks = [];
      if (currentUserGroup.get('nav_override') !== false) {
        _.each(currentUserGroup.get('nav_override'), function (sectionItems, section) {
          _.each(sectionItems, function (item, title) {
            var path = item.path || '';
            customBookmarks.push({
              title: title,
              url: path,
              identifier: title,
              section: section
            });
          });
        });
      } else {
        console.error('The nav override JSON for this user group is malformed – the default nav will be used instead');
      }

      var isCustomBookmarks = false;
      if (customBookmarks.length) {
        isCustomBookmarks = true;
        bookmarks = bookmarks.concat(customBookmarks);
      }

      // Filter out blacklisted bookmarks (case-sensitive)
      bookmarks = _.filter(bookmarks, function (bookmark) {
        return !_.contains(navBlacklist, (bookmark.title || '').toLowerCase());
      });

      // Turn into collection
      tabs = new Tabs.Collection(tabs);

      app.bookmarks = new Bookmarks.Collection(bookmarks, {
        isCustomBookmarks: isCustomBookmarks
      });

      //////////////////////////////////////////////////////////////////////////////
      //Override backbone sync for custom error handling
      var sync = Backbone.sync;
      Backbone.sync = function (method, model, options) {
        var existingErrorHandler = function(){};
        if (undefined !== options.error) {
          existingErrorHandler = options.error;
        }

        var errorCodeHandler = function (xhr, status, thrown) {
          //@todo: note that status is getting overwritten. don't!
          status = xhr.status;

          existingErrorHandler(xhr, status, thrown);
        };

        if (options.errorPropagation !== false) {
          options.error = errorCodeHandler;
        }

        var httpOptions = app.options.http || {};
        var emulateEnabled =  httpOptions ? httpOptions.emulate_enabled : false;
        var emulatedMethods = httpOptions ? httpOptions.emulate_methods : true;
        var methodMap = {
          'create': 'POST',
          'update': 'PUT',
          'patch':  'PATCH',
          'delete': 'DELETE',
          'read':   'GET'
        };

        if (
          emulateEnabled === true
          && (
            !_.isArray(emulatedMethods)
            || (emulatedMethods.indexOf(methodMap[method]) >= 0)
          )
        ) {
          options.emulateHTTP = true;
        }

        return sync(method, model, options);
      };

      // Toggle responsive navigation
      $(document).on('click', '.responsive-nav-toggle', function (event) {
        $('#main').toggleClass('sidebar-active');
        $('.invisible-blocker').toggleClass('sidebar-active');
      });

      // Close sidebar when clicking
      $(document).on('click', '#sidebar', function (event) {
        $('#main').removeClass('sidebar-active');
        $('.invisible-blocker').removeClass('sidebar-active');
      });

      // Cancel default file drop
      $(document).on('drop dragover', function (event) {
        event.preventDefault();
      });

      $(document).on('mousewheel DOMMouseScroll', function (event) {
        if (app.noScroll && event.target.nodeName !== 'TEXTAREA') {
          event.preventDefault();
        }
      });

      // Cancel default CMD + S;
      $(window).keydown(_.bind(function (event) {
        if (event.keyCode === 83 && event.metaKey) {
          event.preventDefault();
        }
      }, this));

      // TODO: move these event handlers to alerts.js
      $(document).on('ajaxStart.directus', function (event) {
        app.trigger('progress');
      });

      $(document).on('ajaxStop.directus', function (event) {
        app.trigger('load');
      });

      function logOutIfPublicRequest(xhr) {
        if (xhr.responseJSON && xhr.responseJSON.public === true) {
          $.xhrPool.abortAll();
          app.logOut(true, true);
        }
      }

      $(document).ajaxSuccess(function (event, xhr) {
        logOutIfPublicRequest(xhr);
      });

      // Capture sync errors...
      $(document).ajaxError(function (event, xhr, settings) {

        logOutIfPublicRequest(xhr);

        if (settings.errorPropagation === false) {
          return;
        }

        var type;
        var isJSON;
        var messageTitle;
        var messageBody;
        var error;
        var details;

        if (xhr.statusText === 'abort') {
          return;
        }

        isJSON = !!xhr.responseJSON;
        messageBody = isJSON ? xhr.responseJSON : xhr.responseText;
        error = {
          message: __t('unknown')
        };

        if (isJSON) {
          error = messageBody.error;
        }

        if (!isJSON && _.isString(messageBody)) {
          try {
            messageBody = JSON.parse(messageBody);
            error = messageBody.error;
          } catch (e) {
            // do nothing
            messageBody = null;
          }
        }

        switch (xhr.status) {
          case 404:
            messageTitle = __t('not_found');
            messageBody = __t('x_not_found', {what: 'URL'}) + '<br>' + settings.url;
            break;
          case 403:
            messageTitle = __t('restricted_access');
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

            // app.logErrorToServer(type, messageTitle, details);
            break;
        }

        app.trigger('alert:error', messageTitle, error.message, details)
      });

      // And js errors...
      window.onerror = function (message, file, line) {
        var type = 'JS';
        var details = 'Error: ' + message + '\nFile: ' + file + '\n Line:' + line;
        // app.logErrorToServer(type, 'Error', details);
        app.trigger('alert:error', 'Error', details);
      };

      app.router = new Router({
        extensions: extensions,
        tabs: tabs
      });

      // Trigger the initial route and enable HTML5 History API support, set the
      // root folder to '/' by default.  Change in app.js.
      Backbone.history.start({ pushState: true, root: app.root });

      // All navigation that is relative should be passed through the navigate
      // method, to be processed by the router. If the link has a `data-bypass`
      // attribute, bypass the delegation completely.
      $(document).on('click', 'a[href]:not([data-bypass])', function (event) {
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
          event.preventDefault();

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
        $('#header-shadow').css({opacity: windowScroll});
      });
    });
  });
});
