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
      'click #removeOverlay': function() {
        app.router.removeOverlayPage(this);
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch({reset: true});
    },

    initialize: function() {
      this.table = ListViewManager.getInstance({collection: this.collection, navigate: true, maxColumns: 8});

      var that = this;

      this.table.events = {
        'click tbody td': function(e) {
          var $target = $(e.target);
          if ($target.is("input")) return;
          var $checkbox = $target.closest('tr').find('td.check > input');
          $checkbox.attr('checked', $checkbox.attr('checked') === undefined);
          that.save();
        }
      };

      this.headerOptions.route.title = this.collection.table.id;
    }

  });

});