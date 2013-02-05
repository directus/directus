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
  "ui/ui"
],

function(app, Router, Backbone, Directus, UI) {

    var data = window.directusData;

    app.columns = {};
    app.entries = {};
    app.preferences = {};
    app.tables = new Directus.Collection([], {filters: {columns: ['table_name','comment','count','date_modified','single'], conditions: {hidden: false, is_junction_table: false}}} );
    app.settings = new Directus.Settings(data.settings, {parse: true});
    app.settings.url = app.API_URL + 'settings';


    // Always bootstrap schema and table info.
    _.each(data.tables, function(options) {

      var tableName = options.schema.id;

      app.columns[tableName] = new Directus.CollectionColumns(options.columns, {parse: true});
      app.columns[tableName].url = app.API_URL + 'tables/' + tableName + '/columns';

      // Set user preferences
      app.preferences[tableName] = new Backbone.Model(options.preferences);
      app.preferences[tableName].url = app.API_URL + 'tables/' + tableName + '/preferences';

      // Set tables schema
      options.schema.url = app.API_URL + 'tables/' + tableName;
      app.tables.add(new Backbone.Model(options.schema));

      // Temporary quick fix
      app.columns[tableName].table = app.tables.get(tableName);

    });

    // Instantiate entries
    app.tables.each(function(table) {
      if (table.id === 'directus_media') {
        table.title = "Media";
        app.media = new Directus.Media([], {structure: app.columns.directus_media, table: table, preferences: app.preferences.directus_media});
        app.media.url = app.API_URL + 'media';
        return;
      }
      app.entries[table.id] = new Directus.Entries.Collection([], {
        structure: app.columns[table.id],
        table: table,
        preferences: app.preferences[table.id]
      });
    }, this);

    app.users = app.entries.directus_users;
    app.users.reset(data.users, {parse: true});
    app.users.table.title = "Users";
    app.uid = 1;

    app.messages = app.entries.directus_messages;

    app.activity = app.entries.directus_activity;
    app.activity.table.title = "Activity";

    app.uiSettings = UI.settings();

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    app.router = new Router({data: window.directusData});


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
        alert(status.responseText);
      }
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
