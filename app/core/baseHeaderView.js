//  header..js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'core/notification'
],

function(app, _, Backbone, __t, Notification) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'header/header',

    el: '#header',

    lastHeaderHeight: 0,

    events: {
      'click .veggieburger': 'toggleMenu',
      'click #removeOverlay': 'closeOverlayPage',
      'click #saveSnapshotBtn': 'saveSnapshot'
    },

    toggleMenu: function () {
      $('body').toggleClass('sidebar-open');
    },

    // prevent the header to be removed after when rendered twice
    keep: true,

    closeOverlayPage: function() {
      app.router.removeTopOverlayPage();
    },

    saveSnapshot: function() {
      var that = this;

      app.router.openModal({type: 'prompt', text: __t('what_would_you_like_to_name_this_bookmark'), callback: function(name ) {
        if(name === null || name === "") {
          Notification.error(__t('please_fill_in_a_valid_name'));
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

    pinSnapshot: function (title) {
      if (!app.getBookmarks().isBookmarked(title)) {
        app.getBookmarks().addNewBookmark({
          title: title,
          url: Backbone.history.fragment,
          user: app.user.id,
          section: 'search'
        });
      }
    },

    serialize: function() {
      if (!this.page) {
        return {}
      }

      var data = this.page.headerOptions;
      var logo = app.settings.get('global').get('cms_thumbnail_url');

      if (data.route.breadcrumbs && data.route.breadcrumbs.length > 1) {
        data.route.lastBreadcrumbAnchor = data.route.breadcrumbs[data.route.breadcrumbs.length-1].anchor;
      }

      data.cms_thumbnail_url = logo ? logo.url : null;

      return data;
    },

    beforeRender: function() {
      if (!this.page) {
        return;
      }

      // hotfix adding dedicated class for settings
      var options = this.page.headerOptions || {};
      var attributes = {};
      attributes['class'] = _.result(options, 'className') || 'header';
      this.$el.attr(attributes);

      var that = this;
      if (options.leftToolbar) {
        options.leftToolbar.forEach(function(widget) {
          that.insertView('#tools-left-insert', widget);
        });
      }

      if (options.rightToolbar) {
        options.rightToolbar.forEach(function(widget) {
          that.insertView('#tools-right-insert', widget);
        });
      }

      // TODO: secondary toolbars were deprecated
      // if (options.leftSecondaryToolbar) {
      //   options.leftSecondaryToolbar.forEach(function(widget) {
      //     that.insertView('#tools-secondary-left-insert', widget);
      //   });
      // }
      //
      // if (options.rightSecondaryToolbar) {
      //   options.rightSecondaryToolbar.forEach(function(widget) {
      //     that.insertView('#tools-secondary-right-insert', widget);
      //   });
      // }
    },

    afterRender: function() {
      //$(window).bind('resize.app', _.bind(this.setMarginToHeaderHeight, this));

      var secondaryToolbarWidgetCount = this.$el.find('#tools-secondary-left-insert').children().length + this.$el.find('#tools-secondary-right-insert').children().length;
      if (secondaryToolbarWidgetCount > 0) {
        this.$el.parent().parent().addClass('has-toolbar');
      }

      //this.setMarginToHeaderHeight();
    },

    cleanup: function() {
      $(window).unbind("resize.app");
    },

    setPage: function(page) {
      this.page = page;
    },

    setMarginToHeaderHeight: function() {
      var $mainBody = $('#content .main-container'),
          startScrollTop = $mainBody.scrollTop(),
          newHeaderHeight = $('.header1').outerHeight(),
          headerHeightDifference = newHeaderHeight - this.lastHeaderHeight;

      if (newHeaderHeight > 0){
        $mainBody.css('margin-top', newHeaderHeight + 'px').scrollTop(startScrollTop + headerHeightDifference);
        this.lastHeaderHeight = newHeaderHeight;
      }
    }
  });
});
