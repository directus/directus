define([
  'app',
  'backbone',
  'core/directus',
  'modules/activity/chart'
],

function(app, Backbone, Directus, Chart) {

  var Dashboard = app.module();
  var ListView = Directus.Table.extend({});

  Dashboard.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      return {title: this.collection.table.get('title')};
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