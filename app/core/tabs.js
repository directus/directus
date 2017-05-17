//  tabs.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'underscore',
  'core/t'
],

function(app, Backbone, _, __t) {

  'use strict';

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
    template: 'tabs',

    tagName: 'div',

    serialize: function() {

      return {
        avatar: app.users.getCurrentUser().getAvatar(),
        currentUserId: app.users.getCurrentUser().get('id'),
        showSettings: app.users.getCurrentUser().get('group').id === 1,
        unreadMessagesCount: app.messages.unread
      };
    },

    events: {
      'mouseenter .user-menu-toggle': 'openUserMenu',
      'mouseleave .user-menu-toggle': 'closeUserMenu',
      'click a[href$="#logout"]': 'logOut'
    },

    openUserMenu: function () {
      clearTimeout(this.avatarMenuTimer);
      this.$el.find('.user-menu').addClass('active');
    },

    closeUserMenu: function () {
      clearTimeout(this.avatarMenuTimer);
      var self = this;
      this.avatarMenuTimer = setTimeout(function () {
        clearTimeout(self.avatarMenuTimer);
        self.$el.find('.user-menu').removeClass('active');
      }, 500);
    },

    logOut: function (event) {
      event.preventDefault();

      app.router.openModal({type: 'confirm', text: __t('are_you_sure_you_want_to_sign_out'), callback: function () {
        window.location.href = app.API_URL + 'auth/logout';
      }});

      return false;
    },

    afterRender: function () {
      // If we are  showing notification, make sure to show it
      if (app.activityInProgress) {
        $('a[href$="#activity"] span').removeClass('icon-bell').addClass('icon-cycle');
      }
    },

    initialize: function () {
      this.collection.on('change', this.render, this);
      app.users.getCurrentUser().on('change sync', this.render, this);
    }

  });

  return Tabs;
});
