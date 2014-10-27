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

      var animationTime = 1000;
      var me = this;
      var heightTotal = 0;
      var totals = {
        'all': 0,
        'files': 0,
        'system': 0,
        'deleted': 0,
        'edited': 0,
        'added': 0
      };

      $("td[data-sum]").each(function(index){
        if($(this).data('sum') > heightTotal){
          heightTotal = $(this).data('sum');
        }
      });

      $('.chart-key').text(heightTotal);

      $(".bar").each(function(index){
        var barTotal = $(this).attr("data-total");
        var barType = $(this).attr("data-type");
        var percentage = (150 / heightTotal);
        var heightPercentage = Math.floor(percentage * barTotal);
        console.log(heightPercentage, percentage, heightTotal, barTotal);
        $(this).animate({ height: heightPercentage}, animationTime, "swing");

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
      var data = this.collection.map(function(model) {
        var data = {
          "table": model.get('table_name'),
          'time': moment(model.get('datetime')).fromNow(),
          "timestamp": model.get('datetime')
        };

        switch(model.get('action')) {
          case 'LOGIN':
            data.category = "system";
            break;
          case 'UPDATE':
            data.category = "edit";
            break;
          case 'ADD':
            data.category = "add";
            break;
          case 'DELETE':
            data.category = "delete";
            break;
          case 'REPLY':
            data.category = "message";
            break;
        }

        if(data.table == "directus_files") {
          data.category = "file";
        }
        if(data.table == "directus_ui") {
          data.category = "system";
        }
        if(data.table == "directus_messages") {
          data.category = "message";
        }

        return data;
      });

      //Filter out data that is set to hidden
      data = _.filter(data, function(item) {
        return !item.hidden;
      });

      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return moment(item.timestamp);
      });

      var groupedData = [];

      data.forEach(function(group) {
        var date = moment(group.timestamp).format('MMMM-D-YYYY');
        if(!groupedData[date]) {
          //If Today Have it say Today
          if(date == moment().format('MMMM-D-YYYY')) {
            groupedData[date] = {title: "Today", data: []};
          } else {
            groupedData[date] = {title: moment(group.timestamp).format('MMMM D'), data: []};
          }
        }
        groupedData[date].data.push(group);
      });

      data = [];

      for(var group in groupedData) {
        groupedData[group].logins = 0;
        groupedData[group].edits = 0;
        groupedData[group].adds = 0;
        groupedData[group].deletes = 0;
        groupedData[group].messages = 0;
        groupedData[group].files = 0;
        groupedData[group].system = 0;
        groupedData[group].total = 0;
        for(var groupData in groupedData[group].data) {
          if(groupedData[group].data[groupData].category == "login"){ groupedData[group].logins += 1; }
          if(groupedData[group].data[groupData].category == "edit"){ groupedData[group].edits += 1; }
          if(groupedData[group].data[groupData].category == "add"){ groupedData[group].adds += 1; }
          if(groupedData[group].data[groupData].category == "delete"){ groupedData[group].deletes += 1; }
          if(groupedData[group].data[groupData].category == "message"){ groupedData[group].messages += 1; }
          if(groupedData[group].data[groupData].category == "file"){ groupedData[group].files += 1; }
          if(groupedData[group].data[groupData].category == "system"){ groupedData[group].system += 1; }
          groupedData[group].total += 1;
        }
        data.push(groupedData[group]);
      }

      return {activities: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });

  return Chart;
});