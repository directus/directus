define([
  'app',
  'backbone',
  'core/directus'
],

function(app, Backbone, Directus) {

  "use strict";

  var Chart = Backbone.Layout.extend({

    tagName: 'div',

    template: 'modules/activity/activity-chart',

    attributes: {'class':'activity-module'},

    numberWithCommas: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    afterRender: function() {
      //////////////////////////////////////////////////////////////////////////////
      console.log("test");
      var animationTime = 1000;
      var me = this;
      var totals = {
        'all': 0,
        'files': 0,
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
      totals.all = totals.files + totals.system + totals.deleted + totals.edited + totals.added;

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

    serialize: function() {
      var tables = app.schemaManager.getTables();

      var data = this.collection.map(function(model) {
        var data = {
          "table": model.get('table_name'),
          'time': moment(model.get('datetime')).fromNow(),
          "timestamp": model.get('datetime'),
          "user_avatar": model.get('user')
        };
      });

      return {activities: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });

  return Chart;
});