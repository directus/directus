//  router.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(function (require, exports, module) {

  'use strict';

  var app              = require('app'),
      directus         = require('directus'),
      Backbone         = require('backbone'),
      _                = require('underscore'),
      Utils            = require('utils'),
      Notification     = require('core/notification'),
      WelcomeModal     = require('core/modals/welcome'),
      //Directus       = require('core/directus'),
      Tabs             = require('core/tabs'),
      BaseHeaderView   = require('core/baseHeaderView'),
      Bookmarks        = require('core/bookmarks'),
      SchemaManager    = require('schema/SchemaManager'),
      EntriesManager   = require('core/EntriesManager'),
      ExtensionManager = require('core/ExtensionManager'),
      PreferenceModel  = require('core/PreferenceModel'),
      Activity         = require('modules/activity/activity'),
      Table            = require('modules/tables/table'),
      Settings         = require('modules/settings/settings'),
      Files            = require('modules/files/files'),
      Users            = require('modules/users/users'),
      Messages         = require('modules/messages/messages'),
      __t              = require('core/t'),
      moment           = require('moment');

  var Router = Backbone.Router.extend({
    routes: {
      '':                                            'tables',
      'tables(/pref/:pref)':                         'tables',
      'tables/:name(/pref/:pref)(/pref/:pref)':      'entries',
      'tables/:name/:id(/pref/:pref)':               'entry',
      'bookmark/:title':                             'bookmark',
      'activity(/pref/:pref)':                       'activity',
      'files(/pref/:pref)(/pref/:pref)':             'files',
      'files/:id(/pref/:pref)':                      'filesItem',
      'users(/pref/:pref)(/pref/:pref)':             'users',
      'users/:id(/pref/:pref)':                      'user',
      'settings(/pref/:pref)':                       'settings',
      'settings/:name(/pref/:pref)':                 'settings',
      'settings/tables/:table(/pref/:pref)':         'settingsTable',
      'settings/permissions/:groupId(/pref/:pref)':  'settingsPermissions',
      'messages(/pref/:pref)':                       'messages',
      'messages/new(/pref/:pref)':                   'newMessage',
      'messages/:id(/response/:respId)':             'message',
      '*notFound':                                   'notFound'
    },

    route: function (route, name, callback) {
      var router = this;
      var args = _.toArray(arguments);
      if (!callback) callback = this[name];

      var cb = function () {
        if (_.isFunction(this.before)) this.before.apply(router, args);
        callback.apply(router, arguments);
        if (_.isFunction(this.after)) this.after.apply(router, args);
      };
      return Backbone.Router.prototype.route.call(this, route, name, cb);
    },

    navigateTo: function (route, alertMessage) {
      this.showAlertNextRoute(alertMessage);
      this.navigate(route, {trigger: true});
    },

    getRouteParameters: function (route, fragment) {
      var r = this._routeToRegExp(route);
      var args = this._extractParameters(r, fragment);
      return args;
    },
    // @todo: refactoring
    before: function (route, name) {
      var fragment = Backbone.history.fragment;

      if (fragment) {
        var routeHistoryBase = fragment;
        if (this.routeHistory.base === '' || routeHistoryBase.indexOf(this.routeHistory.base) !== 0) {
          this.routeHistory.base = routeHistoryBase;
          this.routeHistory.stack = [];
          this.routeHistory.routes = {};
        }

        this.routeHistory.subrouteId = null;

        var currentRoute = _.last(this.routeHistory.stack);
        var nextRoute = {route: name, path: fragment, args: this.getRouteParameters(route, fragment), subroutes: []};

        // Exists
        if (currentRoute && nextRoute) {
          var current = currentRoute = this.routeHistory.routes[currentRoute.path];
          var next = this.routeHistory.routes[nextRoute.path];

          if (next) {
            delete this.routeHistory.routes[currentRoute.path];
            currentRoute = undefined;
          }
        }

        if (currentRoute) {
          currentRoute.scrollTop = parseInt(document.body.scrollTop, 10) || 0;
          currentRoute.toRoute = nextRoute;
        }

        this.routeHistory.stack.push(nextRoute);
        this.routeHistory.last = currentRoute ? currentRoute.path : fragment;

        if (!this.routeHistory.routes[fragment]) {
          this.routeHistory.routes[fragment] = nextRoute;
        }
      }

      var mainSidebar = document.getElementById('mainSidebar');
      if (mainSidebar) {
        this.scrollTop = parseInt(mainSidebar.scrollTop, 10) || 0;
      }

      // TODO: Make the "cache" collection, at least a light caching layer/object
      // NOTE: This is a hotfix to prevent caching the collection when we've moved to another page
      // We actually only used it on `entry` and `header`
      // by removing it to any other page but entry endpoints we make sure bookmarks doesn't use it as reference
      // See: https://github.com/directus/directus/issues/1972
      if (name !== 'entry') {
        this.currentCollection = undefined;
      }
    },

    after: function (route, name) {
      var currentRoute = this.routeHistory.routes[this.routeHistory.last];
      var itemID, scrollTop = 0;
      if(currentRoute && currentRoute.path === Backbone.history.fragment) {
        if(currentRoute.toRoute) {
          itemID = _.last(_.filter(currentRoute.toRoute.args, function (v) {
            return v !== null
          }));
        }
        scrollTop = currentRoute.scrollTop;
      }

      this.v.main.trigger.apply(this.v.main, ['flashItem', itemID, scrollTop]);

      var mainSidebar = document.getElementById('mainSidebar');
      if (mainSidebar) {
        mainSidebar.scrollTop = this.scrollTop;
      }

      _.each(app.user_notifications, function (notification) {
        var title = notification.title;
        var text = notification.text;
        var type = notification.type || 'Information';

        Notification.show(title, text, type);
      });

      app.user_notifications = [];

      if (app.showWelcomeWindow) {
        this.openViewInModal(new WelcomeModal({
          model: app.user
        }));

        app.showWelcomeWindow = false;
      }
    },

    go: function () {
      var array = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
      return this.navigate(array.join('/'), true);
    },

    setTitle: function (title) {
      document.title = title;
    },

    showAlert: function (message, type) {
      if (!this.alert) {
        this.alert = new Backbone.Layout({template: 'alert', serialize: {message: message, type: type}});
        this.v.messages.insertView(this.alert).render();
      }
    },

    showAlertNextRoute: function (message) {
      if (!_.isString(message)) {
        return;
      }

      this.pendingAlert = {
        message: message,
        type: 'alert'
      };
    },

    hideAlert: function () {
      if (this.alert) {
        this.alert.remove();
        this.alert = undefined;
      }
    },

    notFound: function () {
      this.navigateTo('/tables', 'You don\'t have permission to view that page or it doesn\'t exist');
    },

    openModal: function (options, callback) {
      var containerView = this.v.main.getView('#modal_container');

      if (!containerView) {
        return;
      }

      if (containerView.isOpen()) {
        containerView.close(true);
      }

      var view = new directus.Modal.Prompt(options);

      containerView.show(view);
    },

    openUserModal: function (userId) {
      var view = new directus.Modal.User({model: app.users.get(userId)});

      this.openViewInModal(view);
    },

    openFileModal: function (fileId) {
      var view = new directus.Modal.File({fileId: fileId});

      this.openViewInModal(view);
    },

    openViewInModal: function (view) {
      var containerView = this.v.main.getView('#modal_container');
      var router = this;

      if (!containerView || containerView.isOpen()) {
        return;
      }

      // Re-enable for back button working with modals
      // this.navigateToSubroute('modal', arguments, view);
      // view.on('close', function() {
      //   if(router.isCurrentSubrouteView(view)) {
      //     Backbone.history.history.back();
      //   }
      // });

      containerView.show(view);
    },

    overlayViews: [],

    overlayPage: function (view) {
      var views = this.v.main.getViews('#content');
      var lastView = views.last().value();
      var isLastViewPaneOpen = _.result(lastView, 'isRightPaneOpen');

      this.overlayViews.push({
        view: view,
        isParentRightPaneOpen: isLastViewPaneOpen
      });

      if (views.value().length <= 1) {
        this.baseRouteSave = Backbone.history.fragment;
        this.oldLoadUrlFunction = Backbone.History.prototype.loadUrl;
      }

      if (isLastViewPaneOpen) {
        lastView.closeRightPane();
      }

      lastView.scrollTop = document.body.scrollTop;
      views.each(function (view) {
        view.$el.hide();
      });

      // TODO: move this into a global collection
      if (view.model && !view.model._trackingChanges) {
          view.model.startTracking();
      } else if (view.collection) {
        // TODO: make startTracking part of Collection
        var cb = function (collection) {
          collection.each(function (model) {
            if (!model._trackingChanges) {
              model.startTracking();
            }
          });
        };

        cb(view.collection);
        view.collection.on('sync', cb);
      }

      function hasUnsavedAttributes() {
        if (view.model) {
          return !view.model.unsavedAttributes();
        } else if (view.collection) {
          return _.some(view.collection.models, function (model) {
            return !model.unsavedAttributes();
          });
        }

        return false;
      }

      this.navigateToSubroute('overlay', arguments, view);
      this.v.main.insertView('#content', view).render();

      var that = this;
      Backbone.History.prototype.loadUrl = function () {
        if (hasUnsavedAttributes() || (that.baseRouteSave === this.getFragment() || window.confirm('All Unsaved changes will be lost, Are you sure you want to leave?'))) {
          Backbone.History.prototype.loadUrl = that.oldLoadUrlFunction;
          return that.oldLoadUrlFunction.apply(this, arguments);
        } else {
          this.navigate(that.baseRouteSave);
          that.navigate(that.baseRouteSave);
          return true;
        }
      };
    },

    removeTopOverlayPage: function () {
      var view = this.v.main.getViews('#content').last().value();

      return this.removeOverlayPage(view);
    },

    removeOverlayPage: function (view) {
      var topViewInfo = this.overlayViews.pop();
      var topView;

      // Remove Overlay Page
      // NOTE: also remove the last view from the "content" stack
      // making its parent the current last view
      view.remove();
      topView = this.v.main.getViews('#content').last().value();

      if (topViewInfo.isParentRightPaneOpen) {
        topView.openRightPane(true);
      }

      topView.reRender();
      topView.$el.show();

      if (topView.scrollTop !== undefined) {
        document.body.scrollTop = parseInt(topView.scrollTop, 10);
      }

      if (this.v.main.getViews('#content').value().length <= 1) {
        Backbone.History.prototype.loadUrl = this.oldLoadUrlFunction;
        // this.navigate(this.baseRouteSave);
        this.baseRouteSave = undefined;
      }
    },

    setPage: function (View, options) {
      this.v.main.setView('#content', new View(options)).render();
    },

    tables: function () {
      if (_.contains(this.navBlacklist,'tables'))
        return this.notFound();

      this.navigate('/tables'); //If going to / rewrite to tables
      this.setTitle(app.settings.get('global').get('project_name') + ' | Tables');
      this.v.main.setView('#content', new Table.Views.Tables({collection: SchemaManager.getTables()}));
      this.v.main.render();
    },

    entries: function (tableName, pref) {
      var privileges = SchemaManager.getPrivileges(tableName);

      if (
        !SchemaManager.getTable(tableName)
        || _.contains(this.navBlacklist, 'tables')
        || !privileges || !privileges.can('view')
      ) {
        return this.notFound();
      }

      var collection;

      $.xhrPool.abortAll();

      // see if the collection is cached...
      if (this.currentCollection !== undefined && this.currentCollection.table.id === tableName) {
        collection = this.currentCollection;
      } else {
        collection = EntriesManager.getInstance(tableName);
      }

      if (collection.table.get('single')) {
        if(collection.models.length) {
          this.entry(tableName, collection.models[0].get('id'));
        } else {
          // Fetch collection so we know the ID of the "single" row
          collection.once('sync', _.bind(function (collection, xhr, status){
            if(0 === collection.length) {
              // Add new form
              this.router.entry(tableName, 'new');
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
      if (this.loadedPreference) {
        this.loadedPreference = undefined;
      }

      if (pref) {
        this.loadedPreference = pref;
      }

      // Cache collection for next route
      this.currentCollection = collection;
      this.setTitle(app.settings.get('global').get('project_name') + ' | ' + app.capitalize(tableName));

      this.v.main.setView('#content', new Table.Views.List({collection: collection}));
      // this.v.main.render();
    },

    entry: function (tableName, id) {
      var privileges = SchemaManager.getPrivileges(tableName);

      if (
        !SchemaManager.getTable(tableName)
        || _.contains(this.navBlacklist, 'tables')
        || !privileges || !privileges.can('view')
      ) {
        return this.notFound();
      }

      this.setTitle(app.settings.get('global').get('project_name') + ' | Entry');

      var isBatchEdit = (typeof id === 'string') && id.indexOf(',') !== -1,
          collection,
          model,
          options,
          view;

      // see if the collection is cached...
      if (this.currentCollection !== undefined && this.currentCollection.table.id === tableName) {
        collection = this.currentCollection;
      } else {
        collection = EntriesManager.getInstance(tableName);
      }

      // clear the current collection
      this.currentCollection = undefined;

      if (collection.structure.length <= 1) {
        var message = 'Table only has one or no fields.';
        this.navigateTo('/tables/' + tableName, message);
        return;
      }

      if (id === 'new' || isBatchEdit) {
        // Passing parse:true will setup relations
        model = new collection.model({}, {collection: collection, parse: true});
      } else {
        model = collection.get(id);
        if (model === undefined) {
          var primaryColumn = collection.table.getPrimaryColumnName();
          var modelData = {};
          modelData[primaryColumn] = id;
          model = new collection.model(modelData, {collection: collection, parse: true});
          model.idAttribute = primaryColumn;
          model.id = id;
        }
      }

      options = {
        model: model,
        warnOnExit: true,
        parentView: true
      };

      // NOTE: Set warnOnExit flag on to warn the user is leaving a page with unsaved changes
      if (isBatchEdit) {
        view = new Table.Views.BatchEdit(_.extend(options, {batchIds: id.split(',')}));
      } else {
        view = new Table.Views.Edit(options);
      }

      this.v.main.setView('#content', view);
      view.render();
    },

    bookmark: function (title) {
      var self = this;
      var goToUrl = function (title) {
        var bookmark = app.getBookmarks().findWhere({title: title});

        if (bookmark) {
          self.navigate(bookmark.get('url'), {trigger: true});
        } else {
          self.notFound();
        }
      };

      SchemaManager.getBookmarkPreferences(title)
        .done(function (response) {
          if (!response || response.success !== true) {
            goToUrl(title);

            return;
          }

          var data = response.data;
          var tableName = data.table_name;

          self.currentCollection = EntriesManager.getInstance(tableName).clone();
          self.currentCollection.preferences = new PreferenceModel(data, {parse: true});
          self.entries(tableName);
          self.currentCollection = undefined;
        }).fail(function () {
          goToUrl(title);
        });
    },

    activity: function () {
      if (_.contains(this.navBlacklist,'activity'))
        return this.notFound();

      this.setTitle(app.settings.get('global').get('project_name') + ' | Activity');
      this.v.main.setView('#content', new Activity.Views.List({collection: app.activity}));
      this.v.main.render();
    },

    files: function (pref) {
      if (_.contains(this.navBlacklist,'files'))
        return this.notFound();

      if (pref) {
        this.navigate('/files');

        if (this.lastRoute === 'files/' && this.loadedPreference === pref) {
          return;
        }

        this.loadedPreference = pref;
      } else {
        //If no LoadedPref unset
        if (this.loadedPreference && this.lastRoute.indexOf('files/pref/') === -1) {
          this.loadedPreference = null;
        }
      }

      this.setTitle(app.settings.get('global').get('project_name') + ' | Files');
      this.v.main.setView('#content', new Files.Views.List({collection: app.files}));
      this.v.main.render();
    },

    filesItem: function (id) {
      var isNewFile = id === 'new';
      var model;

      if (isNewFile && !app.user.canUploadFiles()) {
        return this.notFound();
      }

      this.setTitle(app.settings.get('global').get('project_name') + ' | File');

      if (isNewFile) {
        model = new app.files.model({}, {collection: app.files});
      } else {
        model = app.files.get(id);
        if (model === undefined) {
          model = new app.files.model({id: id}, {collection: app.files, parse: true});
        }
      }

      this.v.main.setView('#content', new Files.Views.Edit({
        model: model,
        warnOnExit: true,
        parentView: true
      }));

      this.v.main.render();
    },

    users: function (pref) {
      if(pref) {
        this.navigate('/users');

        if(this.lastRoute === 'users/' && this.loadedPreference === pref) {
          return;
        }

        this.loadedPreference = pref;
      } else {
        //If no LoadedPref unset
        if(this.loadedPreference && this.lastRoute.indexOf('users/pref/') === -1)
        {
          this.loadedPreference = null;
        }
      }

      this.setTitle(app.settings.get('global').get('project_name') + ' | Users');
      this.v.main.setView('#content', new Users.Views.List({collection: app.users}));
      this.v.main.render();
    },

    user: function (id) {
      var user = app.user;
      var userGroup = user.get('group');

      var model;
      var isNew = id === 'new';
      this.setTitle(app.settings.get('global').get('project_name') + ' | Users');

      if (isNew) {
        model = new app.users.model({}, {collection: app.users, parse:true});
      } else {
        model = app.users.get(id, false);

        // TODO: Create a method to get or fetch the item from server
        if (!model) {
          var primaryColumn = app.users.table.getPrimaryColumnName();
          var modelData = {};
          modelData[primaryColumn] = id;
          model = new app.users.model(modelData, {collection: app.users, parse: true});
          model.idAttribute = primaryColumn;
          model.id = id;
        }
      }

      var self = this;
      var displayView = function () {
        self.v.main.setView('#content', new Users.Views.Edit({
          model: model,
          warnOnExit: true,
          parentView: true
        }));
        self.v.main.render();
      };

      if (isNew) {
        displayView();
      } else {
        model.fetch({success: function (model, resp) {
          if (_.isEmpty(resp.data)) {
            return self.notFound();
          }

          displayView();
        }});
      }
    },

    settings: function (name) {
      if (_.contains(this.navBlacklist, 'settings') || app.user.get('group').id !== 1) {
        return this.notFound();
      }

      this.setTitle(app.settings.get('project_name') + ' | '+__t('settings'));

      switch(name) {
        case 'tables':
          this.v.main.setView('#content', new Settings.Tables({collection: SchemaManager.getTables()}));
          break;
        case 'global':
          this.v.main.setView('#content', new Settings.Global({
            model: app.settings.asModel(),
            structure: app.schemaManager.getSettingsSchemas()
          }));
          break;
        case 'files':
          this.navigateTo('/settings/global');
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

    settingsTable: function (tableName) {
      if (_.contains(this.navBlacklist, 'settings') || app.user.get('group').id !== 1) {
        return this.notFound();
      }

      this.setTitle(app.settings.get('global').get('project_name') + ' | Settings');

      var collection = EntriesManager.getInstance('directus_tables');
      var model = collection.get(tableName);

      if (model === undefined) {
        var primaryColumn = collection.table.getPrimaryColumnName();
        var modelData = {};
        modelData[primaryColumn] = tableName;
        model = new collection.model(modelData, {collection: collection, parse: true});
        model.idAttribute = primaryColumn;
        model.id = tableName;
      }

      this.v.main.setView('#content', new Settings.Table({model: model}));

      this.v.main.render();
    },

    settingsPermissions: function (groupId) {
      if (_.contains(this.navBlacklist, 'settings') || app.user.get('group').id !== 1) {
        return this.notFound();
      }

      this.setTitle(app.settings.get('global').get('project_name') + ' | Settings - Permissions');
      var collection = EntriesManager.getInstance('directus_groups');
      var model = collection.get(groupId);

      this.v.main.setView('#content', new Settings.GroupPermissions.EditPage({
        model: model,
        collection: collection,
        title: app.groups.get(groupId).get('name')
      }));

      this.v.main.render();
    },

    messages: function (id, respId) {
      this.setTitle(app.settings.get('global').get('project_name') + ' | Messages');
      this.v.main.setView('#content', new Messages.Views.List({
        collection: app.messages,
        currentMessage: id,
        jumpToResponse: respId
      }));
      this.v.main.render();
    },

    message: function (id, respId) {
      return this.messages(id, respId);
    },

    newMessage: function () {
      this.setTitle(app.settings.get('global').get('project_name') + ' | Compose');

      var model = new app.messages.model({from: app.user.id}, {collection: app.messages, parse: true});

      this.v.main.setView('#content', new Messages.Views.New({model: model}));
      this.v.main.render();
    },

    getBookmarkView: function () {
      return this.v.main.getView('#sidebar').getView('#mainSidebar');
    },

    onRoute: function (route, fragments) {
      // try to set the current active nav
      var currentPath = Backbone.history.fragment;
      var bookmarksView = this.getBookmarkView();
      bookmarksView.setActive(currentPath);

      this.lastRoute = currentPath;
      if ( this.loadedPreference ) {
        this.lastRoute += '/' + this.loadedPreference;
      }

      // update user last route
      var currentUser = app.user.clone();
      var history = _.clone(Backbone.history);
      currentUser.updateLastRoute(route, history);

      // check for a pending alert to execute
      if(!_.isEmpty(this.pendingAlert)) {
        this.openModal({type: this.pendingAlert.type, text: this.pendingAlert.message});
        this.pendingAlert = {};
      }
    },

    navigateToSubroute: function(type, callArguments, view) {
      var parentRoute = _.last(this.routeHistory.stack);
      var subroute = {
        type: type,
        callArguments: callArguments,
        view: view
      };

      var subrouteId = parentRoute.subroutes.push(subroute) - 1;
      this.routeHistory.subrouteId = subrouteId;

      Backbone.history.history.pushState({
        subrouteId: subrouteId
      }, document.title, Backbone.history.root + Backbone.history.fragment);
    },

    checkUrlForSubroute: function(e) {
      var newSubrouteId = (e.state) ? e.state.subrouteId : null;
      var previousSubrouteId = this.routeHistory.subrouteId;
      var route = _.last(this.routeHistory.stack);
      var subroutes = route['subroutes'];

      // if previous and new are equal, then we don't need to do anything - it was already done before
      // (and, probably, it was done better)
      if((!_.isNumber(previousSubrouteId) && !_.isNumber(newSubrouteId)) ||
        (previousSubrouteId == newSubrouteId))
      {
        return;
      }

      var toOrdinal = function(value) {
        return (_.isNumber(value)) ? value + 1 : 0;
      };

      if(toOrdinal(newSubrouteId) > toOrdinal(previousSubrouteId)) {
        return Backbone.history.history.go(toOrdinal(previousSubrouteId) - toOrdinal(newSubrouteId));
      }

      if(_.isNumber(previousSubrouteId) && subroutes[previousSubrouteId]) {
        var previousSubroute = subroutes[previousSubrouteId];

        switch(previousSubroute.type) {
          case 'modal':
            previousSubroute.view.close(true);
            break;
          case 'overlay':
            this.removeOverlayPage(previousSubroute.view);
            break;
        }
      }

      this.routeHistory.subrouteId = newSubrouteId;
      route['subroutes'] = route['subroutes'].slice(0, toOrdinal(newSubrouteId));
    },

    isCurrentSubrouteView: function(view) {
      var subrouteId = this.routeHistory.subrouteId
      return (_.isNumber(subrouteId) && _.last(this.routeHistory.stack)['subroutes'][subrouteId].view === view);
    },

    initialize: function (options) {
      window.addEventListener('popstate', function (event) {
        Backbone.trigger('popstate', event);
      });
      this.listenTo(Backbone, 'popstate', this.checkUrlForSubroute);

      var historyState = Backbone.history.history.state;
      if(historyState && _.isNumber(historyState.subrouteId)) {
        window.history.go(-(historyState.subrouteId+1));
      }

      // TODO: Make this into a function
      // to check whether the nav is blacklisted or not
      this.navBlacklist = app.user.get('group').getNavBlacklist();
      // TODO: Allow a queue of pending alerts, maybe?
      this.pendingAlert = {};

      //Fade out and remove splash
      $('body').addClass('initial-load');
      this.tabs = options.tabs;
      this.bookmarks = app.getBookmarks();
      this.extensions = {};

      _.each(options.extensions, function (item) {
        try {
          if (typeof item !== 'undefined') {
            this.extensions[item] = ExtensionManager.getInstance(item);
          }
        } catch (e) {
          console.error('failed to load:', e.stack);
          return;
        }
        // this.extensions[item.id].bind('all', logRoute);
        this.extensions[item].on('route', function () {
          this.trigger('subroute',item);
          this.trigger('route');
          this.trigger('route:'+item,item);
        }, this);
        // this.tabs.add({title: app.capitalize(item.id), id: item.id, extension: true});
      }, this);

      var tabs = new Tabs.View({collection: this.tabs});
      var bookmarks = new Bookmarks.View({collection: this.bookmarks});

      //Top
      var Navbar = Backbone.Layout.extend({
        template: 'navbar',

        el: '#sidebar',

        beforeRender: function () {
          this.insertView('#featureSidebar', tabs);
          this.insertView('#mainSidebar', bookmarks);
        },

        keep: true
      });

      // Holds references to view instances
      this.v = {};

      this.v.main = new Backbone.Layout({

        el: '#main',

        views: {
          '#modal_container': new directus.Modal.Container(),
          '#sidebar': new Navbar({model: app.settings}),
          '#header': new BaseHeaderView()
        }
      });

      this.v.messages = new Backbone.Layout({
        el: '#messages'
      });

      this.routeHistory = {
        stack: [],
        base: '',
        routes: []
      };
      this.bind('route', this.onRoute, this);

      this.v.main.render();
    }
  });

  return Router;

});
