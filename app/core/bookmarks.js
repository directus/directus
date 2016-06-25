//  bookmarks.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  "app",
  "backbone",
  "core/EntriesManager",
  'core/t',
],

function(app, Backbone, EntriesManager, __t) {

  "use strict";

  var Bookmarks = {};

  Bookmarks.Collection = Backbone.Collection.extend({
    initialize: function(models, options) {
      this.url = app.API_URL + 'bookmarks/';
      this.isCustomBookmarks = options.isCustomBookmarks || false;
    },

    comparator: function(a, b) {
      if(a.get('title') < b.get('title')) return -1;
      if(a.get('title') > b.get('title')) return 1;
      return 0;
    },

    setActive: function(route, pref) {
      var activeModel;
      var prefSuffix = _.isString(pref) ? '/pref/' + pref : '';
      var routeURL = encodeURI(route+prefSuffix);
      var found = false;

      // Sort url desc so it match bookmarks first.
      // This: tables/customers/pref/female
      // will be selected first
      // than: tables/customers
      var models = _.sortBy(this.models, function(model) {
        return model.get('url');
      }).reverse();

      _.each(models, function(model) {
        model.unset('active_bookmark', {silent: true});
        if((routeURL).indexOf(model.get('url')) === 0 && !found) {
          activeModel = model;
          found = true;
        }
      });

      if(activeModel) {
        activeModel.set({'active_bookmark':true});
      }
    },

    addNewBookmark: function(data) {
      data.user = data.user.toString();
      if(this.findWhere(data) === undefined) {
        this.create(data);
      }
    },

    removeBookmark: function(data) {
      data.user = data.user.toString();
      var model = this.findWhere(data);

      if(model !== undefined) {
        model.destroy();
        this.remove(model);
      }
    },

    isBookmarked: function(title) {
      if(this.findWhere({'title':title}) !== undefined) {
        return true;
      }
      return false;
    }
  });

  Bookmarks.View = Backbone.Layout.extend({
    template: "bookmarks-list",

    tagName: "ul",

    attributes: {
      class:"row"
    },

    events: {
      'click #saveSnapshotBtn': 'saveSnapshot',
      'click .remove-snapshot': function(e) {
        e.stopPropagation();
        e.preventDefault();

        var bookmarkId = $(e.target).parents('.sidebar-subitem').data('id');
        var bookmark = this.collection.get(bookmarkId);
        if (bookmark) {
          var title = bookmark.get('title');
          app.router.openModal({type: 'confirm', text: 'Delete the bookmark "' + title + '"?', callback: function() {
            bookmark.destroy();
          }});
        }

        return false;
      }
    },

    saveSnapshot: function() {
      var that = this;
      app.router.openModal({type: 'prompt', text: __t('what_would_you_like_to_name_this_bookmark'), callback: function(name ) {
        if(name === null || name === "") {
          alert(__t('please_fill_in_a_valid_name'));
          return;
        }

        var currentCollection = app.router.currentCollection;
        if (typeof currentCollection !== 'undefined') {
          //Save id so it can be reset after render
          var defaultId = currentCollection.preferences.get('id');
          that.listenToOnce(currentCollection.preferences, 'sync', function() {
            if(defaultId) {
              currentCollection.preferences.set({title:null, id: defaultId});
            }
          });

          var schema = app.schemaManager.getFullSchema( currentCollection.table.id );
          var preferences = schema.preferences;
          preferences.unset('id');
          // Unset Id so that it creates new Preference
          preferences.set({title: name});
          preferences.save();
        }

        that.pinSnapshot(name);
      }});
    },

    pinSnapshot: function(title) {
      var data = {
        title: title,
        url: Backbone.history.fragment + "/pref/" + encodeURIComponent(title),
        icon_class: 'icon-search',
        user: app.users.getCurrentUser().get("id"),
        section: 'search'
      };
      if(!app.getBookmarks().isBookmarked(data.title)) {
        app.getBookmarks().addNewBookmark(data);
      }
    },

    serialize: function() {
      var bookmarks = {table:[],search:[],extension:[],other:[]};
      var isCustomBookmarks = this.isCustomBookmarks;

      this.collection.each(function(model) {
        var bookmark = model.toJSON();
        var currentUserGroup = app.users.getCurrentUser().get('group');
        // force | remove from activity from navigation
        if (bookmark.title === 'Activity') return false;

        // skip system nav to an user
        // if the user's group aren't allow to
        // see it on the navigation panel
        var skipSystemNav = false;
        // @todo: bookmark.title to id or url.
        switch (bookmark.title) {
          case 'Activity':
            skipSystemNav = currentUserGroup.get('show_activity') === 0 ? true : false;
            break;
          case 'Files':
            skipSystemNav = currentUserGroup.get('show_files') === 0 ? true : false;
            break;
          case 'Users':
            skipSystemNav = currentUserGroup.get('show_users') === 0 ? true : false;
            break;
          case 'Messages':
            skipSystemNav = currentUserGroup.get('show_messages') === 0 ? true : false;
            break;
        }

        if (skipSystemNav) {
          return false;
        }

        if(bookmarks[bookmark.section]) {
          bookmarks[bookmark.section].push(bookmark);
        } else if(isCustomBookmarks) {
          if(!bookmarks[bookmark.section]) {
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

      var data = {bookmarks: bookmarks, isCustomBookmarks: this.isCustomBookmarks};

      if(Backbone.history.fragment == "tables") {
        data.tablesActive = true;
      }

      return data;
    },

    initialize: function() {

      this.isCustomBookmarks = this.collection.isCustomBookmarks || false;

      var that = this;
      //For some reason need to do this and that....
      this.collection.on('add', function() {
        that.collection.setActive(Backbone.history.fragment);
        that.collection.sort();
        that.render();
      });

      this.collection.on('remove', function() {
        that.render();
      });

      var messageModel = this.collection.where({url: 'messages'});
      if(messageModel) {
        messageModel = messageModel[0];
        if(messageModel) {
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

        if(unread.length>0 && messageModel.get('unread') === false) {
          messageModel.set({unread: true}, {silent: true});
          this.render();
        } else if(unread.length===0 && messageModel.get('unread') === true) {
          messageModel.set({unread: false}, {silent: true});
          this.render();
        }
      }, this);

      // @todo: make this global application events cleaner
      var self = this;
      app.on('tables:preferences', function(widget, collection) {
        if (app.router.loadedPreference) {
          app.router.loadedPreference = undefined;
          self.setActive('tables/' + collection.table.id);
        }
      });
    },

    setActive: function(route, pref) {
      this.collection.setActive(route, pref);
      this.render();
    }

  });

  return Bookmarks;
});
