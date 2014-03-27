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
        new Widgets.BookmarkWidget({widgetOptions: {active: this.isBookmarked}})
      ];

      if (this.collection.hasPermission('add')) {
        widgets.push(new Widgets.AddWidget({widgetOptions: {button: {title: 'New Entry'}}}));
      }
      return  widgets;
    },

    serialize: function() {
      var data = {
        title: this.collection.table.id,
        breadcrumbs: [{title: 'Tables', anchor: '#tables'}]
      };

      if (this.collection.hasPermission('add')) {
        data.buttonTitle = 'Add New Item';
      }

      return data;
    },

    events: {
      'click #addBtn': function() {
        app.router.go('#tables/'+this.collection.table.id+'/new');
        //app.router.setPage(Table.Views.Edit, {model: model});
      },
      'click #bookmarkBtn': function(e) {
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
      //this.table = new Directus.Table({collection: this.collection, navigate: true, maxColumns: 8});
      //ListViewManager
      this.table = ListViewManager.getInstance({collection: this.collection, navigate: true, maxColumns: 8});
      //this.table = new Directus.Table({collection: this.collection, navigate: true, maxColumns: 8});
      this.headerOptions.route.title = this.collection.table.id;

      this.isBookmarked = app.getBookmarks().isBookmarked(this.collection.table.id);
    }

  });

});