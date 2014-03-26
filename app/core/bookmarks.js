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
      this.collection.on('change sync', this.render, this);
    },
    setActive: function(route) {
      this.collection.setActive(route);
      this.render();
    }

  });

  return Bookmarks;
});