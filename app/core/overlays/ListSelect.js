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
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-plus"}})
      ];
    },

    events: {
      'click #removeOverlay': function() {
        app.router.removeOverlayPage(this);
      },
      'click #addBtn': function() {
        this.save();
      }
    },

    save: function() {
      console.log("Save");
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch({reset: true});
    },

    initialize: function() {
      this.table = ListViewManager.getInstance({collection: this.collection, selectable: true});

      var that = this;

      this.table.events = {
        'click tbody td': function(e) {
          var $target = $(e.target);
          if ($target.is("input")) return;
          var $checkbox = $target.closest('tr').find('td.check > input');
          $checkbox.attr('checked', $checkbox.attr('checked') === undefined);
        }
      };

      this.headerOptions.route.title = this.collection.table.id;
    }

  });

});