//  header..js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/header/header.toolsleftview',
  'core/header/header.toolsrightview',
  'core/header/header.secondaryrowview'
],

function(app, Backbone, HeaderToolsLeftView, HeaderToolsRightView, HeaderSecondaryRowView) {

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
      return data;
    },
    beforeRender: function() {
      var options = this.options.headerOptions;

      var that = this;
      options.leftToolbar.forEach(function(widget) {
        that.insertView('#tools-left-insert', widget);
      });
    },
    afterRender: function() {
      var that = this;

      $(window).on('resize', function() {
        that.setMarginToHeaderHeight();
      });

      this.setMarginToHeaderHeight();
    },

    setMarginToHeaderHeight: function() {
      var $mainBody = $('#content .content-body'),
          startScrollTop = $mainBody.scrollTop(),
          newHeaderHeight = this.$('.header1').outerHeight(),
          headerHeightDifference = newHeaderHeight - this.lastHeaderHeight;

      $mainBody.css('margin-top', newHeaderHeight + 'px').scrollTop(startScrollTop + headerHeightDifference);

      this.lastHeaderHeight = newHeaderHeight;
    }
  });
});