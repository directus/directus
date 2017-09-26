//  bookmarks.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'underscore',
  'core/EntriesManager',
  'core/t',
  'core/notification',
],

function(app, Backbone, _, EntriesManager, __t, Notification) {

  'use strict';

  var Bookmarks = {};

  Bookmarks.Model = Backbone.Model.extend({
    constructor: function BookmarksModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    setActive: function (active) {
      this.active = active;
    },

    isActive: function () {
      return !!this.active;
    }
  });

  Bookmarks.Collection = Backbone.Collection.extend({
    constructor: function BookmarksCollection(models, options) {
      this.url = app.API_URL + 'bookmarks/';

      this.isCustomBookmarks = options.isCustomBookmarks || false;
      if (!this.isCustomBookmarks) {
        options.comparator = this._comparator;
      }

      Backbone.Collection.prototype.constructor.apply(this, [models, options]);
    },

    model: Bookmarks.Model,

    _comparator: function(a, b) {
      if (a.get('title') < b.get('title')) {
        return -1;
      }

      if (a.get('title') > b.get('title')) {
        return 1;
      }

      return 0;
    },

    isBookmarkActive: function (routeParts, model) {;
      var parts = _.clone(routeParts || []);
      var title = decodeURIComponent(parts.pop());
      var section = parts.shift();

      return section === 'bookmark' && title === model.get('title');
    },

    setActive: function (route) {
      var activeModel;
      var routeParts = (route || '').split('/');
      var found = false;

      this.each(function (model) {
        model.setActive(false);

        if (found) {
          return false;
        }

        // NOTE: Checking if it's a editing page by pulling out the last parameter
        var detailsUrl = routeParts.slice(0, -1).join('/');
        var urlMatched = false;

        if (this.isBookmarkActive(routeParts, model)) {
          urlMatched = true;
        } else if (route == model.get('url') || detailsUrl == model.get('url')) {
          urlMatched = true;
        }

        if (urlMatched && !found) {
          activeModel = model;
          found = true;
        }
      }, this);

      if (activeModel) {
        activeModel.setActive(true);
      }
    },

    addTable: function(tableModel) {
      this.add({
        title: app.capitalize(tableModel.get('table_name')),
        url: 'tables/' + tableModel.get('table_name'),
        section: 'table'
      });
    },

    addNewBookmark: function(data) {
      data.user = data.user.toString();

      if (this.findWhere(data) === undefined) {
        this.create(data);
      }
    },

    removeBookmark: function(data) {
      if (data.user) {
        data.user = data.user.toString();
      }

      var model = this.findWhere(data);

      if(model !== undefined) {
        model.destroy();
        this.remove(model);
      }
    },

    findByTitle: function (title) {
      return this.findWhere({'title':title});
    },

    isBookmarked: function(title) {
      return this.findByTitle(title) !== undefined;
    }
  });

  Bookmarks.View = Backbone.Layout.extend({
    template: 'bookmarks-list',

    tagName: 'ul',

    attributes: {
      class: 'row'
    },

    events: {
      'click #remove_snapshot': 'onRemoveSnapshot'
    },

    onRemoveSnapshot: function (event) {
      event.stopPropagation();
      event.preventDefault();

      var bookmarkId = $(event.currentTarget).parents('li').data('cid');
      var bookmark = this.collection.get(bookmarkId);

      if (bookmark) {
        var title = bookmark.get('title');
        app.router.openModal({type: 'confirm', text: __t('delete_the_bookmark_x', {title: title}), callback: function() {
          // TODO: redirect to tables after remove a bookmark that's active
          // TODO: Add notificaation
          bookmark.destroy({
            wait: true
          });
        }});
      }

      return false;
    },

    serialize: function() {
      var bookmarks = {table:[],search:[],extension:[],other:[]};
      var isCustomBookmarks = this.isCustomBookmarks;
      var currentUserGroup = app.user.get('group');
      var navBlacklist = currentUserGroup.getNavBlacklist();

      this.collection.each(function (model) {
        var bookmark = model.toJSON();

        if (navBlacklist.indexOf(bookmark.identifier) >= 0) {
          return false;
        }

        // force | remove from activity from navigation
        if (bookmark.title === 'Activity') {
          return false;
        }

        bookmark.cid = model.cid;
        bookmark.active_bookmark = model.isActive();

        if (bookmark.section === 'search') {
          bookmark.url = 'bookmark/' + encodeURIComponent(bookmark.title);
        }

        if (bookmarks[bookmark.section]) {
          bookmarks[bookmark.section].push(bookmark);
        } else if (isCustomBookmarks) {
          if (!bookmarks[bookmark.section]) {
            bookmarks[bookmark.section] = [];
            bookmarks[bookmark.section].isCustomBookmark = true;
          }

          bookmarks[bookmark.section].push(bookmark);
        }
      });

      if (_.isArray(bookmarks.other)) {
        _.each(bookmarks.other, function(bookmark) {
          bookmark.title = __t(bookmark.title.toLowerCase());
        });
      }

      var data = {
        bookmarks: bookmarks,
        isCustomBookmarks: this.isCustomBookmarks
      };

      if (Backbone.history.fragment === 'tables') {
        data.tablesActive = true;
      }

      return data;
    },

    initialize: function() {
      var self = this;
      this.isCustomBookmarks = this.collection.isCustomBookmarks || false;

      // For some reason need to do this and that....
      this.collection.on('add', function() {
        self.collection.setActive(Backbone.history.fragment);
        self.collection.sort();
        self.render();
      });

      this.collection.on('remove', function() {
        self.render();
      });

      var messageModel = this.collection.where({url: 'messages'});
      if (messageModel) {
        messageModel = messageModel[0];
        if (messageModel) {
          messageModel.set({unread: app.messages.unread > 0}, {silent: true});
        }
      }

      app.messages.on('sync change add', function() {
        var messageModel = this.collection.where({url: 'messages'});

        if(!messageModel) {
          return;
        }

        messageModel = messageModel[0];
        var unread = app.messages.where({read: '0'});

        if (unread.length>0 && messageModel.get('unread') === false) {
          messageModel.set({unread: true}, {silent: true});
          this.render();
        } else if (unread.length===0 && messageModel.get('unread') === true) {
          messageModel.set({unread: false}, {silent: true});
          this.render();
        }
      }, this);

      // @todo: make this global application events cleaner
      app.on('tables:preferences', function(widget, collection) {
        if (app.router.loadedPreference) {
          app.router.loadedPreference = undefined;
          self.setActive('tables/' + collection.table.id);
        }
      });

      app.on('tables:change:attributes:hidden', function(model, attribute) {
        if (model.get(attribute) === true) {
          self.removeBookmark(model);
        } else {
          self.addBookmark(model);
        }
      });

      app.on('tables:change:permissions', function(table, permission) {
        if (permission.get('allow_view') > 0) {
          self.addBookmark(table);
        } else {
          self.removeBookmark(table);
        }
      });

      app.on('user:change:group', this.render, this);
    },

    addBookmark: function(model) {
      var title = app.capitalize(model.get('table_name'));
      if (!this.collection.isBookmarked(title)) {
        this.collection.addTable(model);
      }
    },

    removeBookmark: function(model) {
      // @TODO: bookmark must have an Identification attribute.
      this.collection.removeBookmark({
        section: 'table',
        title: app.capitalize(model.get('table_name'))
      });
    },

    setActive: function(route) {
      this.collection.setActive(route);
      this.render();
    }
  });

  return Bookmarks;
});
