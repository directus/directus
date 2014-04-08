define([
  'app',
  'backbone',
  'core/directus',
  'modules/activity/chart',
  "modules/media/media",
  'core/BasePageView'
],

function(app, Backbone, Directus, Chart, Media, BasePageView) {

  "use strict";

  var Dashboard = app.module();

  var ListView = Backbone.Layout.extend({

    tagName: "ul",

    attributes: {
      class: "group-list"
    },

    template: "modules/activity/activity-list",

    events: {
      'click tr': function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        app.router.go('#messages', id);
      }
    },

    serialize: function() {
      var tables = app.schemaManager.getTables();

      var data = this.collection.map(function(model) {
        var data = {
          "table": model.get('table_name'),
          "title": "Entry",
          'time': moment(model.get('datetime')).format("h:mma"),
          "timestamp": model.get('datetime')
        };

        switch(model.get('action')) {
          case 'LOGIN':
            data.action_login = true;
            break;
          case 'UPDATE':
            data.action_edit = true;
            break;
          case 'ADD':
            data.action_add = true;
            break;
          case 'DELETE':
            data.action_delete = true;
            break;
        }

        if(data.action_login) {
          data.table = "login";
          data.user = model.get('user');
        }

        if(tables.get(model.get('table_name'))) {
          var primary_column = tables.get(model.get('table_name')).get('primary_column');
          if(primary_column) {
            var modelData = JSON.parse(model.get('data'));
            if(modelData[primary_column]) {
              data.title = modelData[primary_column];
            }
          }
        }

        return data;
      });

      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -moment(item.timestamp);
      });

      var groupedData = [];

      data.forEach(function(group) {
        var date = moment(group.timestamp).format('MMMM-D-YYYY');
        if(!groupedData[date]) {
          //If Today Have it say Today
          if(date == moment().format('MMMM-D-YYYY')) {
            groupedData[date] = {title: "Today", data: []};
          } else {
            groupedData[date] = {title: moment(group.timestamp).format('MMMM D, YYYY') + " - " + moment(group.timestamp).fromNow(), data: []};
          }
        }
        groupedData[date].data.push(group);
      });
      data = [];

      for(var group in groupedData) {
        data.push(groupedData[group]);
      }

      return {activities: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });

  Dashboard.Views.List = BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Activity'
      }
    },

    events: {
      'click a[data-action=media]': function(e) {
        var id = parseInt($(e.target).attr('data-id'),10);
        var model = new app.media.model({id: id}, {collection: app.media});
        var modal = new Media.Views.Edit({model: model, stretch: true});
        app.router.v.messages.insertView(modal).render();
        app.router.navigate('#media/'+model.id);
        modal.on('close', function() {
          app.router.navigate('#activity');
        });
      }
    },

    serialize: function() {
      return {title: 'Activity'};
    },

    afterRender: function() {
      this.insertView('#page-content', this.chart);
      this.insertView('#page-content', this.table);
      this.collection.fetch();
    },

    initialize: function() {
      this.chart = new Chart({collection: this.collection});
      this.table = new ListView({collection: this.collection});
    }

  });

  return Dashboard;
});