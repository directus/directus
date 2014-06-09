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
        if(confirm("Are your sure you want to logout?")) {
          window.location.href = app.API_URL + "auth/logout";
        } else {
          return false;
        }
      }
    },

    afterRender: function() {
      //If we are  showing notification, make sure to show it
      if(app.activityInProgress) {
        $('a[href$="#activity"] span').removeClass('icon-bell').addClass('icon-cycle');
      }
    },

    initialize: function() {
      this.collection.on('change', this.render, this);
    }

  });

  return Tabs;
});