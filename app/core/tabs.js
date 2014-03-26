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

    // Check if tabs are hidden and puts them into a dropdown
    checkTabs: function() {
      var total = 80, // 40+40 for padding
          tab_width = 0,
          cutoff = false,
          visible_count = 0,
          tabs = [],
          window_width = $(window).width();

      // Get individual tab widths
      $('#tabs ul.nav-tabs li').each(function(index) {
        tabs[index] = $(this).width();
        tab_width += $(this).width();
      });

      if((tab_width+total) > window_width){
        total += 30;
        $('#more-tabs').show();
        $('#tabs').addClass('more-padding');
      } else {
        $('#more-tabs').hide();
        $('#tabs').removeClass('more-padding');
      }

      // Clear the dropdown
      $("#hidden-tabs").empty();

      // Find tabs that fit
      for (var i = 0; i < tabs.length; i++) {
        total += tabs[i];
        if(total > window_width){
          cutoff = i;

          // Add hidden tabs to dropdown
          for (var j = cutoff; j < tabs.length; j++) {
            $('#tabs ul.nav-tabs li:eq('+j+')').clone().appendTo("#hidden-tabs");
          }

          break;
        }
      }

    },

    afterRender: function() {
      this.checkTabs();
    },

    initialize: function() {
      this.collection.on('change sync', this.render, this);

      var that = this;
      window.onresize = function(event) {
        that.checkTabs();
      };
    }

  });

  return Tabs;
});