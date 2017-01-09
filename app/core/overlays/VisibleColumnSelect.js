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
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "add", buttonClass: "", buttonText: "Add"}})
      ];
    },

    events: {
      'click #addBtn': function() {
        this.save();
      }
    },

    save: function() {
      console.log("Save");
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.table.render();
    },

    initialize: function(options) {
      this.table = options.contentView;

      this.headerOptions.route.title = this.collection.table.id + " Visible Columns";
    }

  });

});
