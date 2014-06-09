//  header..js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone'
],

function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({

    template: 'header/header',

    tagName: 'div',

    lastHeaderHeight: 0,

    attributes: {
      class: 'main-container'
    },

    serialize: function() {
      var data = this.options.headerOptions;

      if(this.options.headerOptions.route.breadcrumbs && this.options.headerOptions.route.breadcrumbs.length > 1) {
        data.route.lastBreadcrumbAnchor = this.options.headerOptions.route.breadcrumbs[this.options.headerOptions.route.breadcrumbs.length-1].anchor;
      }

      return data;
    },
    beforeRender: function() {
      var options = this.options.headerOptions;

      var that = this;
      if(options.leftToolbar) {
        options.leftToolbar.forEach(function(widget) {
          that.insertView('#tools-left-insert', widget);
        });
      }

      if(options.rightToolbar) {
        options.rightToolbar.forEach(function(widget) {
          that.insertView('#tools-right-insert', widget);
        });
      }

      if(options.leftSecondaryToolbar) {
        options.leftSecondaryToolbar.forEach(function(widget) {
          that.insertView('#tools-secondary-left-insert', widget);
        });
      }

      if(options.rightSecondaryToolbar) {
        options.rightSecondaryToolbar.forEach(function(widget) {
          that.insertView('#tools-secondary-right-insert', widget);
        });
      }
    },
    afterRender: function() {
      //$(window).bind('resize.app', _.bind(this.setMarginToHeaderHeight, this));

      var secondaryToolbarWidgetCount = this.$el.find('#tools-secondary-left-insert').children().length + this.$el.find('#tools-secondary-right-insert').children().length;
      if(secondaryToolbarWidgetCount > 0) {
        this.$el.parent().parent().addClass('has-toolbar');
      }

      //this.setMarginToHeaderHeight();
    },

    cleanup: function() {
      $(window).unbind("resize.app");
    },

    setMarginToHeaderHeight: function() {
      var $mainBody = $('#content .content-body'),
          startScrollTop = $mainBody.scrollTop(),
          newHeaderHeight = $('.header1').outerHeight(),
          headerHeightDifference = newHeaderHeight - this.lastHeaderHeight;

      if(newHeaderHeight > 0){
        $mainBody.css('margin-top', newHeaderHeight + 'px').scrollTop(startScrollTop + headerHeightDifference);
        this.lastHeaderHeight = newHeaderHeight;
      }
    }
  });
});