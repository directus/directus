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
  "schemas/settings.global",
  "schemas/settings.media",
  "core/extensions",
  "alerts"
],

function(module, app, Router, Backbone, HandlebarsHelpers, Directus, UI, media, users, activity, groups, SettingsGlobalSchema, SettingsMediaSchema, extensions, alerts) {

    var defaultBootstrapData = {
      path: '/directus/',
      page: '',
      extensions: [],
      authenticatedUser: 7,
      groups: {},
      privileges: [],
      ui: [],
      active_media: {},
      users: {},
      me: {
        id: 7
      },
      settings: {
        global: {},
        media: {}
      },
      storage_adapters: {},
      tab_privileges: {},
      tables: [
        {
          preferences: media.preferences,
          schema: _.extend({columns: media.structure}, media.table)
        },
        {
          preferences: users.preferences,
          schema: _.extend({columns: users.structure}, users.table)
        },
        {
          preferences: activity.preferences,
          schema: _.extend({columns: activity.structure}, activity.table)
        },
        {
          preferences: groups.preferences,
          schema: _.extend({columns: groups.structure}, groups.table)
        }
      ],
      nonces: {
        pool: [],
        nonce_pool_size: 10,
        nonce_request_header: "X-Directus-Request-Nonce",
        nonce_response_header: "X-Directus-New-Request-Nonces"
      }
    };

    // default bootstrap data global storage
    window.directusData = _.defaults(window.directusData, defaultBootstrapData);

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
          case 403:
            app.trigger("alert:error", "Unauthorized", "You don't have access for this action");
            //var errorData = jQuery.parseJSON(xhr.responseText);
            //win = new Backbone.Layout();
            //win.$el.html(errorData.message);
            //win.render();
            //app.router.openModal(win, {title: 'Unauthorized!', stretch: false, buttonText:'OK'});
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
    app.uiSettings = UI.settings();
    app.columns = {};
    app.entries = {};
    app.privileges = {};
    app.preferences = {};
    app.tables = new Directus.Collection([], {filters: {columns: ['table_name','comment','active','date_modified','single'], conditions: {hidden: false, is_junction_table: false}}} );
    app.settings = new Directus.Settings(data.settings, {parse: true});
    app.settings.url = app.API_URL + 'settings';


    $(document).ajaxStart(function(e) {
      app.trigger('progress');
    });

    $(document).ajaxStop(function(e) {
      app.trigger('load');
    });

    // Capture sync errors...
    $(document).ajaxError(function(e, xhr) {
      var type = 'Server ' + xhr.status;
      var message = "Server Error";
      var details = encodeURIComponent(xhr.responseText);
      //details = 'xxx';
      app.logErrorToServer(type, message, details);
      app.trigger("alert:error", "Server Error", xhr.responseText);
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
    var nonces = window.directusData.nonces;

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

      app.columns[tableName] = model.columns;
      app.tables.add(model);

      // Set user preferences
      app.preferences[tableName] = new Backbone.Model(options.preferences);
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
    app.media =
    app.entries.directus_media = new Directus.EntriesCollection(data.active_media, {
      table: app.tables.get('directus_media'),
      structure: new Directus.CollectionColumns(media.structure, {parse: true}),
      preferences: app.preferences.directus_media,
      url: app.API_URL + 'media',
      privileges: app.privileges.directus_media,
      parse: true
    });

    // @todo: Maybe do this earlier?
    app.users = new Directus.EntriesCollection(data.users, {
      parse: true,
      table: app.tables.get('directus_users'),
      structure: new Directus.CollectionColumns(users.structure, {parse: true}),
      preferences: app.preferences.directus_users,
      url: app.API_URL + 'tables/directus_users/rows',
      filters: {columns: ['avatar', 'first_name', 'last_name', 'group', 'activity', 'email', 'description']},
      privileges: app.privileges.directus_users,
      rowsPerPage: 3000
    });

    app.activity = new Directus.EntriesCollection({}, {
      table: app.tables.get('directus_activity'),
      structure: new Directus.CollectionColumns(activity.structure, {parse: true}),
      preferences: new Backbone.Model(activity.preferences),
      url: app.API_URL + 'activity/',
      privileges: app.privileges.directus_activity
    });

    app.groups =
    app.entries.directus_groups = new Directus.EntriesCollection(data.groups, {
      table: app.tables.get('directus_groups'),
      preferences: new Backbone.Model(groups.preferences),
      structure: new Directus.CollectionColumns(groups.structure, {parse: true}),
      url: app.API_URL + 'groups/',
      privileges: app.privileges.directus_groups,
      parse: true
    });

/*
    app.me = new Directus.Model(data.me, {
      table: app.tables.get('directus_users'),
      structure: new Directus.CollectionColumns(groups.structure, {parse: true}),
      urlRoot: app.API_URL + 'tables/directus_users/rows/',
      privileges: app.privileges.directus_users
    });

    return;
*/
    //app.me = new Backbone.Model({});

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Instantiate entries
    app.tables.each(function(table) {
      if (table.id.substring(0,9) === 'directus_') return;
      app.entries[table.id] = new Directus.EntriesCollection([], {
        structure: app.columns[table.id],
        table: table,
        preferences: app.preferences[table.id],
        privileges: app.privileges[table.id]
      });
    }, this);

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

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
