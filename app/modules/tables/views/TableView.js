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
      //if(!this.widgets.bookmarkWidget) {
        //this.widgets.bookmarkWidget = new Widgets.ButtonWidget({widgetOptions: {active: this.isBookmarked, buttonId: 'bookmarkBtn', iconClass: 'icon-star'}});
      //}
      var widgets = [
        //this.widgets.bookmarkWidget
      ];

      if (this.collection.hasPermission('add')) {
        if(!this.widgets.addWidget) {
          this.widgets.addWidget = new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-plus", buttonClass: "add-color-background"}});
        }

        widgets.push(this.widgets.addWidget);
      }
      return  widgets;
    },

    rightToolbar: function() {
      return [
        new Widgets.PaginatorWidget({collection: this.collection})
      ];
    },

    leftSecondaryToolbar: function() {
      this.leftSecondaryCurrentState = _.isUndefined(this.leftSecondaryCurrentState) ? 'default' : this.leftSecondaryCurrentState;

      switch(this.leftSecondaryCurrentState) {
        case 'default':
          if(!this.widgets.visibilityWidget) {
            this.widgets.visibilityWidget = new Widgets.VisibilityWidget({collection: this.collection, basePage: this});
          }

          if(!this.widgets.filterWidget) {
            this.widgets.filterWidget = new Widgets.FilterWidget({collection: this.collection, basePage: this});
          }

          return [
            this.widgets.visibilityWidget,
            this.widgets.filterWidget
          ];
        case 'actions':
          if(!this.widgets.selectionActionWidget) {
            this.widgets.selectionActionWidget = new Widgets.SelectionActionWidget({collection: this.collection, widgetOptions: {batchEdit: this.batchEdit}});
          }
          return [
            this.widgets.selectionActionWidget
          ];
      }

      return [];
    },

    rightSecondaryToolbar: function() {

      switch(this.leftSecondaryCurrentState) {
        case 'default':
          return [
            new Widgets.PaginationCountWidget({collection: this.collection})
          ];
        case 'actions':
          return [
            new Widgets.SelectedCountWidget({collection: this.collection})
          ];
      }

      return [];
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
          user: app.users.getCurrentUser().get("id"),
          section: 'table'
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
      this.tryFetch();
    },

    initialize: function() {
      this.widgets = {};

      this.table = ListViewManager.getInstance({collection: this.collection, navigate: true, maxColumns: 8, toolbar: true});
      this.headerOptions.route.title = this.collection.table.id;
      if(!this.collection.options) {
        this.collection.options = {};
      }

      this.collection.options['sort'] = false;

      this.collection.on('select', function() {

        this.actionButtons = Boolean($('.select-row:checked').length);
        this.batchEdit = $('.select-row:checked').length > 1;

        if(this.actionButtons || this.batchEdit) {
          if(this.leftSecondaryCurrentState != 'actions') {
            this.leftSecondaryCurrentState = 'actions';
            this.reRender();
          }
        }
        else {
          if(this.leftSecondaryCurrentState != 'default') {
            this.leftSecondaryCurrentState = 'default';
            this.reRender();
          }
        }
      }, this);

      this.collection.on('sort', function() {
        if(this.leftSecondaryCurrentState != 'default') {
          this.leftSecondaryCurrentState = 'default';
          this.reRender();
        }
      }, this);

      this.isBookmarked = app.getBookmarks().isBookmarked(this.collection.table.id);
    }

  });

});