define([
  'app',
  'backbone',
  'core/BasePageView',
  'core/ListViewManager',
  'core/widgets/widgets'
],

function(app, Backbone, BasePageView, ListViewManager, Widgets) {

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Table View',
        isOverlay: true
      },
    },

    leftToolbar: function() {
      return  [];
    },

    events: {
      'click #addBtn': function() {
      },
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch({reset: true});
    },

    initialize: function() {
      this.table = ListViewManager.getInstance({collection: this.collection, navigate: true, maxColumns: 8});

      this.table.events = {

      };

      this.headerOptions.route.title = this.collection.table.id;
    }

  });

});