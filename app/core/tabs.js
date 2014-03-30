//  tabs.js
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

  var Tabs = {};

  Tabs.Collection = Backbone.Collection.extend({
    setActive: function(route) {

      var model = this.get(route);
      //deactive all tabs
      _.each(this.where({'active':true}),function(model) {
        model.unset('active',{silent: true});
      });

      if (!model) { return; }
      model.set({'active':true});
    },

    initialize: function() {
      app.users.on('reset sync add', function() {
        var userTab = this.get('users');
        if (userTab) {
          userTab.set({count: app.users.table.get('active')});
        }
      }, this);
      if(undefined !== this.get('media')) {
        app.media.on('reset sync add', function() {
          this.get('media').set({count: app.media.table.get('active')});
        }, this);
      }
    }
  });

  Tabs.View = Backbone.Layout.extend({
    template: "tabs",

    tagName: "ul",

    attributes: {
      class:"row"
    },

    serialize: function() {
      var tabs = this.collection.map(function(model) {
        var tab = model.toJSON();
        return tab;
      });
      return {tabs: tabs};
    },

    events: {
     'click a[href$="#logout"]': function(e) {
        e.preventDefault();
        window.location.href = app.API_URL + "auth/logout";
      }
    },

    initialize: function() {
      this.collection.on('change sync', this.render, this);

      console.log(app.messages.unread);
    }

  });

  return Tabs;
});