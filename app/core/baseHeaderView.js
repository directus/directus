//  header..js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/t',
  'core/notification'
],

function(app, Backbone, __t, Notification) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'header/header',

    el: '#header',

    lastHeaderHeight: 0,

    events: {
      'click #removeOverlay': 'closeOverlayPage',
      'click #saveSnapshotBtn': 'saveSnapshot'
    },

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

    pinSnapshot: function(title) {
      var data = {
        title: title,
        url: Backbone.history.fragment + "/pref/" + encodeURIComponent(title),
        icon_class: 'icon-search',
        user: app.users.getCurrentUser().get("id"),
        section: 'search'
      };

      if (!app.getBookmarks().isBookmarked(data.title)) {
        app.getBookmarks().addNewBookmark(data);
      }
    },

    serialize: function() {
      if (!this.page) {
        return {}
      }

      var data = this.page.headerOptions;

      if (data.route.breadcrumbs && data.route.breadcrumbs.length > 1) {
        data.route.lastBreadcrumbAnchor = data.route.breadcrumbs[data.route.breadcrumbs.length-1].anchor;
      }

      return data;
    },

    beforeRender: function() {
      if (!this.page) {
        return;
      }

      var options = this.page.headerOptions;

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

      if (options.leftSecondaryToolbar) {
        options.leftSecondaryToolbar.forEach(function(widget) {
          that.insertView('#tools-secondary-left-insert', widget);
        });
      }

      if (options.rightSecondaryToolbar) {
        options.rightSecondaryToolbar.forEach(function(widget) {
          that.insertView('#tools-secondary-right-insert', widget);
        });
      }
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
      var $mainBody = $('#content .content-body'),
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
