//  bookmarks.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  var Bookmarks = {};

  Bookmarks.Collection = Backbone.Collection.extend({
    initialize: function() {
      this.url = app.API_URL + 'bookmarks/';
    },
    setActive: function(route) {
      //deactive all tabs
      var activeModel;
      _.each(this.models,function(model) {
        model.unset('active',{silent: true});
        if(model.get('url') == route || (model.get('url') == 'tables' && route.indexOf(model.get('url')) != -1)) {
          activeModel = model;
        }
      });

      if(activeModel) {
        activeModel.set({'active':true});
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

    serialize: function() {
      var bookmarks = this.collection.map(function(model) {
        var bookmarks = model.toJSON();
        return bookmarks;
      });
      return {bookmarks: bookmarks};
    },
    initialize: function() {
      var that = this;
      //For some reason need to do this and that....
      this.collection.on('add', function() {
        that.collection.setActive(Backbone.history.fragment);
        that.render();
      });
      this.collection.on('remove', function() {
        that.render();
      });
    },
    setActive: function(route) {
      this.collection.setActive(route);
      this.render();
    }

  });

  return Bookmarks;
});