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
        breadcrumbs: [{title: 'Tables', anchor: '#tables'}]
      },
    },

    leftToolbar: function() {
      var widgets = [
        new Widgets.ButtonWidget({widgetOptions: {active: this.isBookmarked, buttonId: 'bookmarkBtn', iconClass: 'icon-star'}})
      ];

      if (this.collection.hasPermission('add')) {
        widgets.push(new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-plus"}}));
      }
      return  widgets;
    },

    rightToolbar: function() {
      return [
        new Widgets.PaginatorWidget({collection: this.collection})
      ];
    },

    leftSecondaryToolbar: function() {
      this.selectedAction = new Widgets.SelectionActionWidget();
      this.visibilityWidget = new Widgets.VisibilityWidget({collection: this.collection});
      this.filterWidget = new Widgets.FilterWidget({collection: this.collection});
      return [
        this.visibilityWidget,
        this.filterWidget
      ];
    },

    rightSecondaryToolbar: function() {
      this.paginationCountWidget = new Widgets.PaginationCountWidget();
      return [
        this.paginationCountWidget
      ];
    },

    events: {
      'click #addBtn': function() {
        app.router.go('#tables/'+this.collection.table.id+'/new');
      },
      'click #bookmarkBtn': function() {
        var data = {
          title: this.collection.table.id,
          url: Backbone.history.fragment,
          icon_class: 'icon-star',
          user: app.users.getCurrentUser().get("id")
        };
        if(!this.isBookmarked)
        {
          app.getBookmarks().addNewBookmark(data);
        } else {
          app.getBookmarks().removeBookmark(data);
        }
        $('#bookmarkBtn').parent().toggleClass('active');
        this.isBookmarked = !this.isBookmarked;
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch({reset: true});
    },

    initialize: function() {
      this.table = ListViewManager.getInstance({collection: this.collection, navigate: true, maxColumns: 8, toolbar: true});
      this.headerOptions.route.title = this.collection.table.id;

      this.isBookmarked = app.getBookmarks().isBookmarked(this.collection.table.id);
    }

  });

});