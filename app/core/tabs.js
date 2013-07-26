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

  var Tabs = {};

  Tabs.Collection = Backbone.Collection.extend({
    setActive: function(route) {
      var model = this.get(route);
      if (!model) { return; }
      //deactive all tabs
      _.each(this.where({'active':true}),function(model) {
        model.unset('active',{silent: true});
      });
      model.set({'active':true});
    }
  });

  Tabs.View = Backbone.Layout.extend({
    template: "tabs",

    serialize: function() {
      return {tabs: this.collection.toJSON()};
    },

    // Check if tabs are hidden and puts them into a dropdown
    checkTabs: function() {
      var total = 80, // 40+40 for padding
          tab_width = 0,
          cutoff = false,
          visible_count = 0,
          tabs = new Array(),
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
          for (var i = cutoff; i < tabs.length; i++) {
            $('#tabs ul.nav-tabs li:eq('+i+')').clone().appendTo("#hidden-tabs");
          };

          break;
        }
      };

    },

    afterRender: function() {
      this.checkTabs();
    },

    initialize: function() {
      this.collection.on('change sync', this.render, this);

      var that = this;
      window.onresize = function(event) {
        that.checkTabs();
      }
    }

  });

  return Tabs;
});