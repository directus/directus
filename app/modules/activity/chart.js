define([
  'app',
  'backbone',
  'core/directus'
],

function(app, Backbone, Directus) {

  "use strict";

  var view = Backbone.Layout.extend({

    tagName: 'div',

    template: 'activity-chart',

    attributes: {'class':'activity-module'},

    numberWithCommas: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    afterRender: function() {
      //////////////////////////////////////////////////////////////////////////////

      var animationTime = 1000;
      var me = this;
      var totals = {
        'all': 0,
        'media': 0,
        'system': 0,
        'deleted': 0,
        'edited': 0,
        'added': 0
      };

      $(".bar").each(function(index){
        var barTotal = $(this).attr("data-total");
        var barType = $(this).attr("data-type");
        $(this).animate({ height: barTotal }, animationTime, "swing");

        totals[barType] += parseInt(barTotal, 10);

      });

      // Get total activity (could/should be total active items)
      totals.all = totals.media + totals.system + totals.deleted + totals.edited + totals.added;

      //////////////////////////////////////////////////////////////////////////////

      $(".activity-total h2").each(function(index){

        var el = $(this);
        var type = el.attr("data-type");
        var total = totals[type];


        // Animate the element's value
        $({someValue: 0}).animate({someValue: total}, {
          duration: animationTime,
          easing:'swing',
          step: function() {
            el.text( me.numberWithCommas(Math.ceil(this.someValue)) );
          },
          complete: function() {
            el.text( me.numberWithCommas(this.someValue) );
          }
        });
      });
    },

    initialize: function() {
      this.collection.on('reset', function() {
        if (this.collection.total) this.render();
      }, this);
    }

  });

  return view;
});