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
      }
    },

    leftToolbar: function() {
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-check", buttonClass: "add-color-background"}})
      ];
    },

    rightToolbar: function() {
      return [
        new Widgets.PaginatorWidget({collection: this.collection})
      ];
    },

    leftSecondaryToolbar: function() {
      return [
        new Widgets.VisibilityWidget({collection: this.collection, basePage: this}),
        new Widgets.FilterWidget({collection: this.collection, basePage: this})
      ];
    },

    rightSecondaryToolbar: function() {
      return [
        new Widgets.PaginationCountWidget({collection: this.collection})
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
    },

    itemClicked: function(e) {
      var $target = $(e.target);
      var $checkbox = $target.closest('tr').find('td.check > input');

      if($checkbox.prop('checked')) {
        $checkbox.prop('checked', false);
      } else {
        $checkbox.prop('checked', true);
      }
    },

    initialize: function(options) {

      //Default to true
      if(options.selectable === undefined) {
        options.selectable = true;
      }

      this.table = ListViewManager.getInstance({collection: this.collection, selectable: options.selectable});

      var that = this;

      this.table.events = {
        'click tbody td': function(e) {
          that.itemClicked(e);
        }
      };

      this.headerOptions.route.title = this.collection.table.id;
    }
  });

});