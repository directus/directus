//  router.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  "app",
  "core/directus",
  "core/tabs",
  "ui/ui",
  "modules/dashboard",
  "modules/table",
  "modules/settings",
  "modules/media",
  "modules/users",
  "modules/messages",
  "core/modal",
  "core/collection.settings",
  "core/collection.upload"
],

function(app, Directus, Tabs, UI, Dashboard, Table, Settings, Media, Users, Messages, Modal, CollectionSettings, CollectionMedia) {

  var Router = Backbone.Router.extend({

    routes: {
      "":                       "index",
      "tables":                 "tables",
      "tables/:name":           "entries",
      "tables/:name/:id":       "entry",
      "activity":               "activity",
      "media":                  "media",
      "users":                  "users",
      "users/:id":              "users",
      "settings":               "settings",
      "settings/:name":         "settings",
      "settings/:name/:table":  "settings",
      "messages":               "messages"
    },

    index: function() {

    },

    go: function() {
      var array = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
      return this.navigate(array.join("/"), true);
    },

    setTitle: function(title) {
      document.title = title;
    },

    showAlert: function(message) {
      if (!this.alert) {
        this.alert = new Backbone.Layout({template: 'alert', serialize: {message: message}});
        this.v.messages.insertView(this.alert).render();
      }
    },

    hideAlert: function() {
      if (this.alert) {
        this.alert.remove();
        this.alert = undefined;
      }
    },

    openModal: function(view, options) {
      options.view = view;
      var modal = new Directus.Modal(options);
      this.v.messages.insertView(modal).render();
      return modal;
    },

    setPage: function(view, options) {
      options.ui = UI;
      this.v.main.setView('#content', new view(options)).render();
    },

    tables: function() {
      this.setTitle('Tables');
      this.tabs.setActive('tables');
      this.v.main.setView('#content', new Table.Views.Tables({collection: this.tables}));
      this.v.main.render();
    },

    entries: function(tableName) {
      this.setTitle('Tables');
      if (this.entries[tableName].table.get('single')) {
        this.entry(tableName, 1);
        return;
      }
      this.tabs.setActive('tables');
      this.v.main.setView('#content', new Table.Views.List({collection: this.entries[tableName]}));
      this.v.main.render();
    },

    //UGLY AS HELL NEED MAJOR REFACTORING
    entry: function(tableName, id) {
      this.setTitle('Tables');
      this.tabs.setActive('tables');
      var collection = this.entries[tableName];
      var model;

      if (id === "new") {
        model = new collection.model({},{collection: collection});

      } else {
        model = collection.get(id);
        if (model === undefined) {
          model = new collection.model({id: id}, {collection: collection});
        }
      }

      this.v.main.setView('#content', new Table.Views.Edit({model: model}));
      this.v.main.render();

    },

    activity: function() {
      this.setTitle('Activity');
      this.tabs.setActive('activity');
      this.v.main.setView('#content', new Dashboard.Views.List({collection: this.activity}));
      this.v.main.render();
    },

    media: function() {
      this.setTitle('Media');
      this.tabs.setActive('media');
      this.v.main.setView('#content', new Media.Views.List({collection: this.media}));
      this.v.main.render();
    },

    users: function(id) {
      this.setTitle('Users');
      this.tabs.setActive('users');
      if (id !== undefined) {
        this.v.main.setView('#content', new Users.Views.Edit({model: this.users.get(id)}));
      } else {
        this.v.main.setView('#content', new Users.Views.List({collection: this.users}));
      }
      this.v.main.render();
    },

    //Use sub router?

    settings: function(name, tableName) {
      this.setTitle('Settings');
      this.tabs.setActive('settings');
      if (name === 'global') {
        var globalStructure = new Directus.CollectionColumns([
          {id: 'site_name', ui: 'textinput', char_length: 255},
          {id: 'site_url', ui: 'textinput', char_length: 255},
          {id: 'cms_color', ui: 'select', options: { options: [{title: 'Green', value: 'green'}]}},
          {id: 'cms_user_auto_sign_out', ui: 'numeric', char_length: 255, options: {size: 'small'}}
        ], {parse: true});
        this.v.main.setView('#content', new Settings.Views.Global({model: this.settings.get('global'), structure: globalStructure}));
      } else if (name === 'tables') {
        if (tableName) {
          this.v.main.setView('#content', new Settings.Views.Table({collection: this.columns[tableName]}));
        } else {
          this.v.main.setView('#content', new Settings.Views.Tables({collection: this.tables}));
        }
      } else if (name === 'media') {
        var mediaStructure = new Directus.CollectionColumns([
          {id: 'media_naming', ui: 'select', char_length: 255, options:{ options: [{title: 'Original', value: 'original'}, {title: 'Unique', value: 'unique'}] }},
          {id: 'allowed_thumbnails', ui: 'textinput', char_length: 255},
          {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {size: 'small'}}
        ], {parse: true});
        this.v.main.setView('#content', new Settings.Views.Global({model: this.settings.get('media'), structure: mediaStructure}));
      } else if (name === 'permissions') {
        this.v.main.setView('#content', new Settings.Views.Permissions());
      } else if (name === 'system') {
        this.v.main.setView('#content', new Settings.Views.System());
      } else if (name === 'about') {
        this.v.main.setView('#content', new Settings.Views.About());
      } else {
        this.v.main.setView('#content', new Settings.Views.Main({tables: this.tables}));
      }
      this.v.main.render();
    },

    messages: function(name) {
      this.setPage(Messages.Views.List, {collection: this.messages});
    },

    initialize: function(options) {

      // All this should probably move up a level to 'main'.
      this.columns = {};
      this.entries = {};
      this.tables = new Directus.Collection([], {filters: {columns: ['table_name','comment','count','date_modified','single'], conditions: {hidden: false, is_junction_table: false}}} );
      this.preferences = {};

      this.settings = new CollectionSettings(options.data.settings, {parse: true});
      this.settings.url = app.API_URL + 'settings';

      //Cache UI settings
      this.uiSettings = UI.settings();

      // Always bootstrap schema and table info.
      _.each(options.data.tables,function(options) {

        var tableName = options.schema.id;

        this.columns[tableName] = new Directus.CollectionColumns(options.columns, {parse: true});
        this.columns[tableName].url = app.API_URL + 'tables/' + tableName + '/columns';

        // Set user preferences
        this.preferences[tableName] = new Backbone.Model(options.preferences);
        this.preferences[tableName].url = app.API_URL + 'tables/' + tableName + '/preferences';

        // Set tables schema
        options.schema.url = app.API_URL + 'tables/' + tableName;
        this.tables.add(new Backbone.Model(options.schema));

        // Temporary quick fix
        this.columns[tableName].table = this.tables.get(tableName);

      }, this);

      // Instantiate entries
      this.tables.each(function(table) {
        if (table.id === 'directus_media') {
          table.title = "Media";
          this.media = new CollectionMedia([], {structure: this.columns.directus_media, table: table, preferences: this.preferences.directus_media});
          this.media.url = app.API_URL + 'media';
          return;
        }
        this.entries[table.id] = new Directus.Entries.Collection([], {
          structure: this.columns[table.id],
          table: table,
          preferences: this.preferences[table.id]
        });
      }, this);

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      this.users = this.entries.directus_users;
      this.users.reset(options.data.users, {parse: true});
      this.users.table.title = "Users";
      this.uid = 1;

      this.messages = this.entries.directus_messages;

      this.activity = this.entries.directus_activity;
      this.activity.table.title = "Activity";

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      this.tabs = new Tabs.Collection([
        {title: "Activity", id: "activity", count: this.tables.get('directus_activity').get('count')},
        {title: "Tables", id: "tables", count: this.tables.length},
        {title: "Media", id: "media", count: this.tables.get('directus_media').get('count')},
        {title: "Users", id: "users", count: this.tables.get('directus_users').get('count')},
        {title: "Settings", id: "settings"}
      ]);

      var user = this.users.get(1);

      //Top
      var Navbar = Backbone.Layout.extend(
        {
          template: "navbar",
          serialize: function() {
            return {
              user: user.get('first_name'),
              avatar: user.get('avatar'),
              siteName: this.model.get('site_name'),
              siteUrl: this.model.get('site_url')
              //settings: this.settings.get('global').toJSON()
            };
          }
      });

      //holds references to view instances
      this.v = {};
      this.v.content = undefined;

      this.v.main = new Backbone.Layout({
        el: "#main",
        //template: "main",
        views: {
          '#navbar': new Navbar({model: this.settings.get('global')}),
          '#tabs': new Tabs.View({collection: this.tabs})
        }
      });

      this.v.messages = new Backbone.Layout({
        el: "#messages"
      });

      // Update media counter
      this.media.on('all', function() {
        var media = this.tabs.get('media');
        media.set({count: this.media.length});
      }, this);

      this.v.main.render();
      //this.navigate('#tables', {trigger: true});
    }
  });

  return Router;

});