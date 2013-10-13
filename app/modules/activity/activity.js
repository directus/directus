define([
  'app',
  'backbone',
  'core/directus',
  'modules/activity/chart',
  "modules/media/media"
],

function(app, Backbone, Directus, Chart, Media) {

  "use strict";

  var Dashboard = app.module();
  var ListView = Directus.Table.extend({});

  Dashboard.Views.List = Backbone.Layout.extend({

    template: 'page',

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
      this.table = new ListView({collection: this.collection, tableHead: false, rowIdentifiers: ['type','action']});
    }

  });

  return Dashboard;
});