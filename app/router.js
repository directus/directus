//  router.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(function(require, exports, module) {

  "use strict";

  var app              = require('app'),
      //Directus       = require('core/directus'),
      Tabs             = require('core/tabs'),
      Bookmarks        = require('core/bookmarks'),
      SchemaManager    = require('schema/SchemaManager'),
      EntriesManager   = require('core/EntriesManager'),
      ExtensionManager = require('core/ExtensionManager'),
      Activity         = require('modules/activity/activity'),
      Table            = require('modules/tables/table'),
      Settings         = require('modules/settings/settings'),
      Files            = require('modules/files/files'),
      Users            = require('modules/users/users'),
      Messages         = require('modules/messages/messages'),
      Modal            = require('core/modal'),
      moment           = require('moment');

  var Router = Backbone.Router.extend({

    routes: {
      "":                               "tables",
      "tables":                         "tables",
      "tables/:name(/pref/:pref)":      "entries",
      "tables/:name/:id":               "entry",
      "activity":                       "activity",
      "files(/pref/:pref)":             "files",
      "files/:id":                      "filesItem",
      "users(/pref/:pref)":             "users",
      "users/:id":                      "user",
      "settings":                       "settings",
      "settings/:name":                 "settings",
      "settings/tables/:table":         "settingsTable",
      "settings/permissions/:groupId":  "settingsPermissions",
      "messages":                       "messages",
      "messages/new":                   "newMessage",
      "messages/:id":                   "message",
      '*notFound':                      "notFound"
    },

    route: function(route, name, callback) {
      var router = this;
      var args = _.toArray(arguments);
      if (!callback) callback = this[name];

      var cb = function() {
        if (_.isFunction(this.before)) this.before.apply(router, args);
        callback.apply(router, arguments);
        if (_.isFunction(this.after)) this.after.apply(router, args);
      };
      return Backbone.Router.prototype.route.call(this, route, name, cb);
    },

    navigateTo: function(route, alertMessage) {
      this.showAlertNextRoute(alertMessage);
      this.navigate(route, {trigger: true});
    },

    getRouteParameters: function(route, fragment) {
      var r = this._routeToRegExp(route);
      var args = this._extractParameters(r, fragment);
      return args;
    },
    // @todo: refactoring
    before: function(route, name) {
      var fragment = Backbone.history.fragment;
      if(fragment) {
        var routeHistoryBase = fragment;
        if (this.routeHistory.base === '' || routeHistoryBase.indexOf(this.routeHistory.base) !== 0) {
          this.routeHistory.base = routeHistoryBase;
          this.routeHistory.stack = [];
          this.routeHistory.routes = {};
        }

        var currentRoute = _.last(this.routeHistory.stack);
        var nextRoute = {route: name, path: fragment, args: this.getRouteParameters(route, fragment)};

        // Exists
        if(currentRoute && nextRoute) {
          var current = currentRoute = this.routeHistory.routes[currentRoute.path];
          var next = this.routeHistory.routes[nextRoute.path];

          if(next) {
            delete this.routeHistory.routes[currentRoute.path];
            currentRoute = undefined;
          }
        }

        if(currentRoute) {
          currentRoute.scrollTop = parseInt(document.body.scrollTop, 10) || 0;
          currentRoute.toRoute = nextRoute;
        }
        this.routeHistory.stack.push(nextRoute);
        this.routeHistory.last = currentRoute ? currentRoute.path : fragment;
        if(!this.routeHistory.routes[fragment]) {
          this.routeHistory.routes[fragment] = nextRoute;
        }
      }

      var mainSidebar = document.getElementById('mainSidebar');
      if(mainSidebar) {
        this.scrollTop = parseInt(mainSidebar.scrollTop, 10) || 0;
      }
    },

    after: function(route, name) {
      var currentRoute = this.routeHistory.routes[this.routeHistory.last];
      var itemID, scrollTop = 0;
      if(currentRoute && currentRoute.path === Backbone.history.fragment) {
        if(currentRoute.toRoute) {
          itemID = _.last(_.filter(currentRoute.toRoute.args, function(v){ return v !== null}));
        }
        scrollTop = currentRoute.scrollTop;
      }

      this.v.main.trigger.apply(this.v.main, ['flashItem', itemID, scrollTop]);

      var mainSidebar = document.getElementById('mainSidebar');
      if(mainSidebar) {
        mainSidebar.scrollTop = this.scrollTop;
      }
    },

    go: function() {
      var array = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
      return this.navigate(array.join("/"), true);
    },

    setTitle: function(title) {
      document.title = title;
    },

    showAlert: function(message, type) {
      if (!this.alert) {
        this.alert = new Backbone.Layout({template: 'alert', serialize: {message: message, type: type}});
        this.v.messages.insertView(this.alert).render();
      }
    },

    showAlertNextRoute: function(message) {
      if (!_.isString(message)) {
        return;
      }

      this.pendingAlert = {
        message: message,
        type: 'alert'
      };
    },

    hideAlert: function() {
      if (this.alert) {
        this.alert.remove();
        this.alert = undefined;
      }
    },

    notFound: function() {
      this.navigateTo('/tables', 'You do not have permission to view that page or it doesn\'t exist');
    },

    openModal: function(options, callback) {
      if(this.v.main.getViews('#modal-container')._wrapped.length >= 1) {
        return;
      }

      var modalView = new Modal.Prompt(options);
      this.v.main.insertView('#modal-container', modalView).render();
    },

    overlayPage: function(view) {
      if(this.v.main.getViews('#content')._wrapped.length <= 1) {
        this.baseRouteSave = Backbone.history.fragment;
        this.oldLoadUrlFunction = Backbone.History.prototype.loadUrl;
      }

      var lastView = this.v.main.getViews('#content').last()._wrapped;
      lastView.scrollTop = document.body.scrollTop;
      this.v.main.getViews('#content').each(function(view) {
        view.$el.hide();
      });
      this.v.main.insertView('#content', view).render();

      var that=this;
      Backbone.History.prototype.loadUrl = function() {
        if(that.baseRouteSave == this.getFragment() || window.confirm("All Unsaved changes will be lost, Are you sure you want to leave?")) {
          Backbone.History.prototype.loadUrl = that.oldLoadUrlFunction;
          return that.oldLoadUrlFunction.apply(this, arguments);
        } else {
          this.navigate(that.baseRouteSave);
          that.navigate(that.baseRouteSave);
          return true;
        }
      };
    },

    removeOverlayPage: function(view) {
      view.remove(); //Remove Overlay Page
      var vieww = this.v.main.getViews('#content').last()._wrapped;
      vieww.$el.show();

      if(vieww.scrollTop !== undefined) {
        document.body.scrollTop = parseInt(vieww.scrollTop, 10);
      }

      if(this.v.main.getViews('#content')._wrapped.length <= 1) {
        Backbone.History.prototype.loadUrl = this.oldLoadUrlFunction;
        this.navigate(this.baseRouteSave);
        this.baseRouteSave = undefined;
      }
    },

    setPage: function(View, options) {
      this.v.main.setView('#content', new View(options)).render();
    },

    tables: function() {
      if (_.contains(this.tabBlacklist,'tables'))
        return this.notFound();

      this.navigate('/tables'); //If going to / rewrite to tables
      this.setTitle(app.settings.get('global').get('site_name') + ' | Tables');
      this.v.main.setView('#content', new Table.Views.Tables({collection: SchemaManager.getTables()}));
      this.v.main.render();
    },

    entries: function(tableName, pref) {
      var privileges = SchemaManager.getPrivileges(tableName);
      if (_.contains(this.tabBlacklist,'tables') || (privileges && privileges.get('allow_view') == 0)) {
        return this.notFound();
      }

      var collection;

      $.xhrPool.abortAll();

      if (!SchemaManager.getTable(tableName)) {
        return this.notFound();
      }

      // see if the collection is cached...
      if (this.currentCollection !== undefined && this.currentCollection.table.id == tableName) {
        collection = this.currentCollection;
      } else {
        collection = EntriesManager.getInstance(tableName);
      }



      if (collection.table.get('single')) {
        if(collection.models.length) {
          this.entry(tableName, collection.models[0].get('id'));
        } else {
          // Fetch collection so we know the ID of the "single" row
          collection.once('sync', _.bind(function(collection, xhr, status){
            if(0 === collection.length) {
              // Add new form
              this.router.entry(tableName, "new");
            } else {
              // Edit first model
              var model = collection.models[0];
              this.router.entry(tableName, model.get('id'));
            }
          }, {router:this}));
          collection.fetch();
        }
        return;
      }

      //Clear loaded preference if navigating to new entries
      if(this.lastRoute != "tables/" + tableName && this.loadedPreference) {
        this.loadedPreference = undefined;
      }

      if(pref) {
        this.navigate("/tables/" + tableName);

        if(this.lastRoute == "tables/" + tableName && this.loadedPreference == pref) {
          return;
        }

        this.loadedPreference = pref;
      }

      // Cache collection for next route
      this.currentCollection = collection;
      this.setTitle(app.settings.get('global').get('site_name') + ' | ' + app.capitalize(tableName));

      this.v.main.setView('#content', new Table.Views.List({collection: collection}));
      this.v.main.render();
    },

    entry: function(tableName, id) {
      if (_.contains(this.tabBlacklist,'tables'))
        return this.notFound();

      this.setTitle(app.settings.get('global').get('site_name') + ' | Entry');

      var isBatchEdit = (typeof id === 'string') && id.indexOf(',') !== -1,
          collection,
          model,
          view;

      // see if the collection is cached...
      if (this.currentCollection !== undefined && this.currentCollection.table.id == tableName) {
        collection = this.currentCollection;
      } else {
        collection = EntriesManager.getInstance(tableName);
      }

      if (collection === undefined) {
        return this.notFound();
      }

      if (id === "new" || isBatchEdit) {
        // Passing parse:true will setup relations
        model = new collection.model({}, {collection: collection, parse: true});

      } else {
        model = collection.get(id);
        if (model === undefined) {
          model = new collection.model({id: id}, {collection: collection, parse: true});
        }
      }

      if (isBatchEdit) {
        view = new Table.Views.BatchEdit({model: model, batchIds: id.split(',')});
      } else {
        view = new Table.Views.Edit({model: model});
      }

      this.v.main.setView('#content', view);
      view.render();
    },

    activity: function() {
      if (_.contains(this.tabBlacklist,'activity'))
        return this.notFound();

      this.setTitle(app.settings.get('global').get('site_name') + ' | Activity');
      this.v.main.setView('#content', new Activity.Views.List({collection: app.activity}));
      this.v.main.render();
    },

    files: function(pref) {
      if (_.contains(this.tabBlacklist,'files'))
        return this.notFound();

      if(pref) {
        this.navigate("/files");

        if(this.lastRoute == "files/" && this.loadedPreference == pref) {
          return;
        }

        this.loadedPreference = pref;
      } else {
        //If no LoadedPref unset
        if(this.loadedPreference && this.lastRoute.indexOf('files/pref/') == -1)
        {
          this.loadedPreference = null;
        }
      }

      this.setTitle(app.settings.get('global').get('site_name') + ' | Files');
      this.v.main.setView('#content', new Files.Views.List({collection: app.files}));
      this.v.main.render();
    },

    filesItem: function(id) {
      var model;

      this.setTitle(app.settings.get('global').get('site_name') + ' | File');

      if (id === "new") {
        model = new app.files.model({}, {collection: app.files});
      } else {
        model = app.files.get(id);
        if (model === undefined) {
          model = new app.files.model({id: id}, {collection: app.files, parse: true});
        }
      }

      this.v.main.setView('#content', new Files.Views.Edit({model: model}));
      this.v.main.render();
    },

    users: function(pref) {
      if(pref) {
        this.navigate("/users");

        if(this.lastRoute == "users/" && this.loadedPreference == pref) {
          return;
        }

        this.loadedPreference = pref;
      } else {
        //If no LoadedPref unset
        if(this.loadedPreference && this.lastRoute.indexOf('users/pref/') == -1)
        {
          this.loadedPreference = null;
        }
      }

      this.setTitle(app.settings.get('global').get('site_name') + ' | Users');
      this.v.main.setView('#content', new Users.Views.List({collection: app.users}));
      this.v.main.render();
    },

    user: function(id) {
      var user = app.users.getCurrentUser();
      var userGroup = user.get('group');

      if (!(parseInt(id,10) === user.id || userGroup.id === 1)) {
        return this.notFound();
      }

      var model;
      this.setTitle(app.settings.get('global').get('site_name') + ' | Users');

      if (id === "new") {
        model = new app.users.model({}, {collection: app.users, parse:true});
      } else {
        model = app.users.get(id);
      }
      this.v.main.setView('#content', new Users.Views.Edit({model: model}));
      this.v.main.render();
    },

    settings: function(name) {
      if (_.contains(this.tabBlacklist,'settings'))
        return this.notFound();

      this.setTitle(app.settings.get('global').get('site_name') + ' | Settings');

      switch(name) {
        case 'tables':
          this.v.main.setView('#content', new Settings.Tables({collection: SchemaManager.getTables()}));
          break;
        case 'global':
          this.v.main.setView('#content', new Settings.Global({model: app.settings.get('global'), title: 'Global', structure: SchemaManager.getColumns('settings', 'global')}));
          break;
        case 'files':
          this.v.main.setView('#content', new Settings.Global({model: app.settings.get('files'), title: 'Files', structure: SchemaManager.getColumns('settings', 'files')}));
          break;
        case 'permissions':
          this.v.main.setView('#content', new Settings.Permissions({collection: app.groups}));
          break;
        case 'system':
          this.v.main.setView('#content', new Settings.System());
          break;
        case 'about':
          this.v.main.setView('#content', new Settings.About());
          break;
        default:
          this.v.main.setView('#content', new Settings.Main({tables: SchemaManager.getTables()}));
          break;
      }

      this.v.main.render();
    },

    settingsTable: function(tableName) {
      if (_.contains(this.tabBlacklist,'settings'))
        return this.notFound();

      this.setTitle(app.settings.get('global').get('site_name') + ' | Settings');

      this.v.main.setView('#content', new Settings.Table({model: SchemaManager.getTable(tableName)}));

      this.v.main.render();
    },

    settingsPermissions: function(groupId) {
      if (_.contains(this.tabBlacklist,'settings'))
        return this.notFound();

      this.setTitle(app.settings.get('global').get('site_name') + ' | Settings - Permissions');
      var collection = new Settings.GroupPermissions.Collection([], {url: app.API_URL + 'privileges/'+groupId});
      this.v.main.setView('#content', new Settings.GroupPermissions.Page({collection: collection, title: app.groups.get(groupId).get('name')}));
      this.v.main.render();
    },

    messages: function(name) {
      this.setTitle(app.settings.get('global').get('site_name') + ' | Messages')
      this.v.main.setView('#content', new Messages.Views.List({collection: app.messages}));
      this.v.main.render();
    },

    message: function(id) {
      var model = app.messages.get(id);
      this.setTitle(app.settings.get('global').get('site_name') + ' | Message');

      if (model === undefined) {
        model = new app.messages.model({id: id}, {collection: app.messages, parse: true});
        model.fetch();
      }

      this.v.main.setView('#content', new Messages.Views.Read({model: model}));
      this.v.main.render();
    },

    newMessage: function() {
      this.setTitle(app.settings.get('global').get('site_name') + ' | Compose');

      var model = new app.messages.model({from: app.users.getCurrentUser().id}, {collection: app.messages, parse: true});

      this.v.main.setView('#content', new Messages.Views.New({model: model}));
      this.v.main.render();
    },

    onRoute: function(route) {
      // try to set the current active nav
      var currentPath = Backbone.history.fragment;
      var bookmarksView = this.v.main.getView('#sidebar').getView('#mainSidebar');
      bookmarksView.setActive(currentPath);
      this.lastRoute = currentPath;

      // update user last route
      var currentUser = app.users.getCurrentUser();
      var history = _.clone(Backbone.history);
      currentUser.updateLastRoute(route, history);

      // check for a pending alert to execute
      if(!_.isEmpty(this.pendingAlert)) {
        this.openModal({type: this.pendingAlert.type, text: this.pendingAlert.message});
        this.pendingAlert = {};
      }
    },

    initialize: function(options) {

      this.tabBlacklist = (options.tabPrivileges.tab_blacklist || '').split(',');
      // @todo: Allow a queue of pending alerts, maybe?
      this.pendingAlert = {};

      //Fade out and remove splash
      $('body').addClass('initial-load');
      this.tabs = options.tabs;
      this.bookmarks = app.getBookmarks();
      this.extensions = {};

      _.each(options.extensions, function(item) {
        try {
          this.extensions[item] = ExtensionManager.getInstance(item);
        } catch (e) {
          console.log(item + ' failed to load:', e.stack);
          this.tabs.get(item).set({'error': e});
          return;
        }
        //this.extensions[item.id].bind('all', logRoute);
        this.extensions[item].on('route', function() {
          this.trigger('subroute',item);
          this.trigger('route:'+item,item);
        }, this);
        //this.tabs.add({title: app.capitalize(item.id), id: item.id, extension: true});
      }, this);

      var user = app.users.getCurrentUser();
      var tabs = new Tabs.View({collection: this.tabs});

      var bookmarks = new Bookmarks.View({collection: this.bookmarks});
      
      //Top
      var Navbar = Backbone.Layout.extend(
      {

        template: "navbar",

        tagName: 'div',

        serialize: function() {
          return {
            siteUrl: this.model.get('site_url'),
            messageCounter: app.messages.unread,
            cms_thumbnail_url: this.model.get('cms_thumbnail_url')
          };
        },
        beforeRender: function() {
          this.insertView('#featureSidebar', tabs);
          this.insertView('#mainSidebar', bookmarks);
        },

        keep: true
      });

      //holds references to view instances
      this.v = {};
      var nav = new Navbar({model: app.settings.get('global')});

      //var nav = new Navbar({model: app.settings.get('global'), collection: this.tabs});
      this.v.main = new Backbone.Layout({

        el: "#main",

        views: {
          '#sidebar': nav
        }

      });

      this.v.messages = new Backbone.Layout({
        el: "#messages"
      });

      this.routeHistory = {stack: [], base: '', routes: []};
      this.bind('route', this.onRoute, this);

      this.v.main.render();
    }
  });

  return Router;

});