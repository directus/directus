define([
  'app',
  'backbone',
  'core/BasePageView',
  'core/ListViewManager'
],

function(app, Backbone, BasePageView, ListViewManager) {

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Table View',
        breadcrumbs: [{title: 'Tables', anchor: '#tables'}]
      },
    },

    leftToolbar: function() {
      return [];
    },

    rightToolbar: function() {
      return [];
    },

    secondaryRow: function() {
      return [
        new YadaYada()
      ];
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

      if (this.collection.hasPermission('add')) {
        this.headerOptions.leftToolbar.addBtn = {
          title: 'Add Table'
        };
      }

      this.isBookmarked = app.getBookmarks().isBookmarked(this.collection.table.id);

      this.headerOptions.leftToolbar.showBookmarkBtn = {
        active: this.isBookmarked
      };

      this.headerOptions.leftToolbar.push(new PaginatorView({collection: this.collection}))
    }

  });

});