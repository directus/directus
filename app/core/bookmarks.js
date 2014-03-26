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
    setActive: function(route) {
      var model = this.get(route);
      //deactive all tabs
      _.each(this.where({'active':true}),function(model) {
        model.unset('active',{silent: true});
      });

      if (!model) { return; }
      model.set({'active':true});
    },
    addNewBookmark: function(data) {
      data.user = data.user.toString();
      if(this.findWhere(data) === undefined) {
        this.create(data, {url: app.API_URL + 'bookmarks/'});
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
      if(this.findWhere({'title':title})) {
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
      this.collection.on('change sync', this.render, this);
      //For some reason need to do this and that....
      this.collection.on('add', function() {
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