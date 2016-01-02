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

    tagName: "div",

    serialize: function() {
      var currentUser = app.users.getCurrentUser();
      var currentUserAvatar = currentUser.getAvatar();

      var currentUserId = app.users.getCurrentUser().get("id");

      var showSettings = (app.users.getCurrentUser().get('group').id === 1)? true : false;

      return {avatar: currentUserAvatar, currentUserId: currentUserId, showSettings: showSettings};
    },

    events: {
     'click a[href$="#logout"]': function(e) {
        e.preventDefault();
        app.router.openModal({type: 'confirm', text: 'Are you sure you want to sign out?', callback: function() {
          window.location.href = app.API_URL + "auth/logout";
        }});
        return false;
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