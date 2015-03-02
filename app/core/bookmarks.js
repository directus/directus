//  bookmarks.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  "app",
  "backbone",
  "core/EntriesManager"
],

function(app, Backbone, EntriesManager) {

  "use strict";

  var Bookmarks = {};

  Bookmarks.Collection = Backbone.Collection.extend({
    initialize: function(models, options) {
      this.url = app.API_URL + 'bookmarks/';
      this.isCustomBookmarks = options.isCustomBookmarks || false;
    },
    setActive: function(route) {
      //deactive all tabs
      var splitRoute = route.split('/');
      if(splitRoute.length > 2) {
        route = splitRoute[0] + '/' + splitRoute[1];
      }

      var activeModel;
      _.each(this.models,function(model) {
        model.unset('active_bookmark',{silent: true});
        if(model.get('url') == route || (model.get('url') == 'tables' && route.indexOf(model.get('url')) != -1)) {
          activeModel = model;
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
      'click .remove-snapshot': function(e) {
        e.stopPropagation();
        e.preventDefault();

        var url = $(e.target).parent().attr('href');
        if(url) {
          var urlArray = url.split('/');
          var title = urlArray.pop();
          urlArray.pop();
          var table = urlArray.pop();
          if(urlArray.length === 0) {
            table = "directus_" + table;
          }
          if(title && table) {
            app.router.openModal({type: 'confirm', text: 'Are you sure you wish to delete the snapshot: ' + title, callback: function() {
              var user = app.users.getCurrentUser().get("id");
              var collection = EntriesManager.getInstance(table);
              collection.preferences.destroy({contentType: 'application/json', data: JSON.stringify({title:title, table_name: table, user: user}),success: function() {
                app.getBookmarks().removeBookmark({title: title, icon_class: 'icon-search', user: user});
              }});
            }});
          }
        }

        return false;
      }
    },

    serialize: function() {
      var bookmarks = {table:[],search:[],extension:[],other:[]};
      var isCustomBookmarks = this.isCustomBookmarks;

      this.collection.each(function(model) {
        var bookmark = model.toJSON();
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
          this.render();
        }
      }

      app.messages.on('sync change add', function(data) {
        var messageModel = this.collection.where({url: 'messages'});
        if(messageModel) {
          messageModel = messageModel[0];
          if(messageModel) {
            var currentMaxId = app.messages.maxId || 0;
            var maxId = data.maxId || 0;
            var hasUnread = (currentMaxId < maxId) ? true : false;
            messageModel.set({unread: hasUnread}, {silent: true});
            if(hasUnread) {
              this.render();
            }
          }
        }
      }, this);
    },
    setActive: function(route) {
      this.collection.setActive(route);
      this.render();
    }

  });

  return Bookmarks;
});