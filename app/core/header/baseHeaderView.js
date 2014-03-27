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

  var Header = app.module();

  Header.HeaderModel = Backbone.Model.extend({
    defaults: {
      options: {},
      route: {
        title: "Directus"
      }
    },
    setRoute: function(title, breadcrumbs, options) {
      var data = {
        title: title,
        breadcrumbs: breadcrumbs
      };
      if(options === undefined) {
        options = {};
      }
      this.set({options: options, route: data});
    }
  });

  return Backbone.Layout.extend({

    template: 'header/header',

    tagName: 'div',

    lastHeaderHeight: 0,

    attributes: {
      class: 'main-container'
    },

    serialize: function() {
      var data = {};

      return data;
    },
    beforeRender: function() {
      var options = {};
      if(options.leftToolbar) {
        this.leftToolbar = this.setView('#tools-left-insert', new HeaderToolsLeftView({toolOptions: options.leftToolbar}));
      } else if(this.leftToolbar) {
        this.leftToolbar.remove();
      }

      if(options.rightToolbar) {
        this.rightToolbar = this.setView('#tools-right-insert', new HeaderToolsRightView({toolOptions: options.rightToolbar}));
      } else if(this.rightToolbar) {
        this.rightToolbar.remove();
      }

      if(options.secondaryRow) {
        this.secondaryRow = this.setView('#secondary-row-insert', new HeaderSecondaryRowView({toolOptions: options.secondaryRow}));
      } else if(this.secondaryRow) {
        this.secondaryRow.remove();
      }
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