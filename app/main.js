//  main.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

require([
  "app",
  "router",
  "backbone",
  "core/directus",
  "core/ui",
  "schemas/media",
  "schemas/users",
  "schemas/activity",
  "schemas/groups"
],

function(app, Router, Backbone, Directus, UI, media, users, activity, groups) {

    // Bootstrap global data
    var data = window.directusData;

    app.root = data.path;
    app.API_URL = data.path + 'api/1/';
    app.RESOURCES_URL = '/resources/';
    app.uiSettings = UI.settings();
    app.columns = {};
    app.entries = {};
    app.preferences = {};
    app.tables = new Directus.Collection([], {filters: {columns: ['table_name','comment','active','date_modified','single'], conditions: {hidden: false, is_junction_table: false}}} );
    app.settings = new Directus.Settings(data.settings, {parse: true});
    app.settings.url = app.API_URL + 'settings';

    // Always bootstrap schema and table info.
    _.each(data.tables, function(options) {

      var tableName = options.schema.id;

      // Set tables schema
      options.schema.url = app.API_URL + 'tables/' + tableName;

      app.tables.add(new Backbone.Model(options.schema));

      if (tableName.substring(0,9) === 'directus_') return;

      app.columns[tableName] = new Directus.CollectionColumns(options.columns, {parse: true});
      app.columns[tableName].url = app.API_URL + 'tables/' + tableName + '/columns';

      // Set user preferences
      app.preferences[tableName] = new Backbone.Model(options.preferences);
      app.preferences[tableName].url = app.API_URL + 'tables/' + tableName + '/preferences';

      // Temporary quick fix
      app.columns[tableName].table = app.tables.get(tableName);
    });

    // Setup core data collections.
    app.media = new Directus.Media(data.active_media, {
      table: app.tables.get('directus_media'),
      structure: new Directus.CollectionColumns(media.structure, {parse: true}),
      preferences: new Backbone.Model(media.preferences),
      url: app.API_URL + 'media',
      parse: true
    });

    app.users = new Directus.Entries.Collection(data.users, {
      parse: true,
      table: app.tables.get('directus_users'),
      structure: new Directus.CollectionColumns(users.structure, {parse: true}),
      preferences: new Backbone.Model(users.preferences),
      url: app.API_URL + 'tables/directus_users/rows'
    });

    app.activity = new Directus.Entries.Collection({}, {
      table: app.tables.get('directus_activity'),
      structure: new Directus.CollectionColumns(activity.structure, {parse: true}),
      preferences: new Backbone.Model(activity.preferences),
      url: app.API_URL + 'activity/'
    });

    app.groups =
    app.entries.directus_groups = new Directus.Entries.Collection(data.groups, {
      table: app.tables.get('directus_groups'),
      preferences: new Backbone.Model(groups.preferences),
      structure: new Directus.CollectionColumns(groups.structure, {parse: true}),
      url: app.API_URL + 'groups/',
      parse: true
    });

    app.permissions = new Backbone.Model();

    //data.groups.each(function(model) {
      //app.permissions.add(model.id
    //});

    // Instantiate entries
    app.tables.each(function(table) {
      if (table.id.substring(0,9) === 'directus_') return;
      app.entries[table.id] = new Directus.Entries.Collection([], {
        structure: app.columns[table.id],
        table: table,
        preferences: app.preferences[table.id]
      });
    }, this);

    _.each(app.uiSettings, function(value, key) {
      if (value.variables === undefined) return;
      //Cheating way to peform a deep-clone
      var deepClone = JSON.parse(JSON.stringify(value.variables));
      app.uiSettings[key].schema = new Directus.CollectionColumns(deepClone, {parse: true});
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.router = new Router();

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

    //Override backbone sync for custom error handling
    var sync = Backbone.sync;

    Backbone.sync = function(method, model, options) {
      options.error = function(xhr, status, thrown) {
        console.log(status.responseText);
      };
      sync(method, model, options);
    };

    //Cancel default file drop
    $(document).on('drop dragover', function(e) {
      e.preventDefault();
    });

    //Cancel default CMD + S;
    $(window).keydown(_.bind(function(e) {
      if (e.keyCode === 83 && e.metaKey) {
        e.preventDefault();
      }
    }, this));
});
