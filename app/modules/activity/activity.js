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

    template: "activity-list",

    events: {
      'click tr': function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        app.router.go('#messages', id);
      }
    },

    serialize: function() {
      var data = this.collection.map(function(model) {

        var data = {
          "table": model.get('table_name'),
          "title": "Test TItle",
          'time': moment(model.get('datetime')).format("h:mma"),
          "timestamp": model.get('datetime')
        };
        return data;
      });

      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -moment(item.timestamp);
      });

      return {activities: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });

  Dashboard.Views.List = BasePageView.extend({

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