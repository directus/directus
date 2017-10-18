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
], function(app, Backbone, _, __t) {

  'use strict';

  var Tabs = {};

  Tabs.Collection = Backbone.Collection.extend({});

  Tabs.View = Backbone.Layout.extend({
    template: 'tabs',

    tagName: 'div',

    serialize: function () {
      var user = app.user;
      var currentUserGroup = user.get('group');
      var navBlacklist = currentUserGroup.getNavBlacklist();
      var showUsers = navBlacklist.indexOf('directus_users') < 0;
      var showFiles = navBlacklist.indexOf('directus_files') < 0;
      var showMessages = navBlacklist.indexOf('directus_messages') < 0;

      return {
        userFullName: user.get('first_name') + ' ' + user.get('last_name'),
        avatar: app.user.getAvatar(),
        showMessages: showMessages,
        showMiddleSection: showUsers || showFiles,
        showUsers: showUsers,
        showFiles: showFiles,
        currentUserId: app.user.id,
        showSettings: app.user.isAdmin(),
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
      app.user.on('change sync', this.render, this);
      app.on('messages:new', this.render, this);
    }
  });

  return Tabs;
});
