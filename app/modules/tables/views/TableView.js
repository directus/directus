define([
  'app',
  'backbone',
  'underscore',
  'core/t',
  'core/BasePageView',
  'core/ListViewManager',
  'modules/tables/views/TableViewRightPane',
  'core/widgets/widgets'
],

function(app, Backbone, _, __t, BasePageView, ListViewManager, TableViewRightPane, Widgets) {

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Table View',
        breadcrumbs: [{title: __t('tables'), anchor: '#tables'}]
      },
    },

    leftToolbar: function() {
      var widgets = this.widgets = [];

      if (this.collection.structure.length > 1 && this.collection.hasPermission('add')) {
        var tableView = this;

        if (!this.widgets.addWidget) {
          this.widgets.addWidget = new Widgets.ButtonWidget({
            widgetOptions: {
              buttonId: 'addBtn',
              iconClass: 'add',
              buttonClass: 'primary',
              buttonText: __t('new_item')
            },
            onClick: function(event) {
              app.router.go('#tables/' + tableView.collection.table.id + '/new');
            }
          });
        }

        widgets.push(this.widgets.addWidget);

        if (this.showDeleteButton) {
          if (!this.widgets.deleteWidget) {
            // var tableView = this;
            this.widgets.deleteWidget = new Widgets.ButtonWidget({
              widgetOptions: {
                buttonId: 'deleteBtn',
                iconClass: 'close',
                buttonClass: 'serious',
                buttonText: __t('delete')
              },
              onClick: function(event) {
                // app.router.go('#tables/' + tableView.collection.table.id + '/new');
              }
            });
          }

          widgets.push(this.widgets.deleteWidget);
        }

        if (this.showBulkEditButton) {
          if (!this.widgets.bulkEditWidget) {
            this.widgets.bulkEditWidget = new Widgets.ButtonWidget({
              widgetOptions: {
                buttonId: 'bulkEditBtn',
                iconClass: 'edit',
                buttonClass: 'important',
                buttonText: __t('bulk_edit')
              },
              onClick: function(event) {
                var $checked = tableView.table.$el.find('.js-select-row:checked');
                var ids = $checked.map(function() {
                  return this.value;
                }).toArray().join();

                var route = Backbone.history.fragment.split('/');
                route.push(ids);
                app.router.go(route);
              }
            });
          }

          widgets.push(this.widgets.bulkEditWidget);
        }

        if (!this.widgets.infoWidget) {
          this.widgets.infoWidget = new Widgets.ButtonWidget({
            widgetOptions: {
              // buttonId: '',
              iconClass: 'info',
              buttonClass: '',
              buttonText: __t('options'),
              help: __t('right_pane_help')
            },
            onClick: function (event) {
              tableView.toggleRightPane();
            }
          });
        }

        widgets.push(this.widgets.infoWidget);

        if (this.showDeleteButton) {
          if (!this.widgets.selectionActionWidget) {
            this.widgets.selectionActionWidget = new Widgets.SelectionActionWidget({collection: this.collection, basePage: this});
          }

          widgets.push(this.widgets.selectionActionWidget);
        }
      }

      return  widgets;
    },

    rightPane: function() {
      return TableViewRightPane;
    },

    rightPaneOptions: function() {
      return {};
    },

    rightToolbar: function() {
      var widgets = [];

      if (!this.showDeleteButton) {
        if (!this.widgets.filterWidget) {
          this.widgets.filterWidget = new Widgets.FilterWidget({collection: this.collection, basePage: this});
        }

        widgets.push(this.widgets.filterWidget);
      }

      return widgets;
    },

    leftSecondaryToolbar: function() {
      this.leftSecondaryCurrentState = _.isUndefined(this.leftSecondaryCurrentState) ? 'default' : this.leftSecondaryCurrentState;

      switch(this.leftSecondaryCurrentState) {
        case 'default':
          if(!this.widgets.visibilityWidget) {
            this.widgets.visibilityWidget = new Widgets.VisibilityWidget({collection: this.collection, basePage: this});
          }

          return [
            this.widgets.visibilityWidget
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
      'click #bookmarkBtn': function() {
        var data = {
          title: this.collection.table.id,
          url: Backbone.history.fragment,
          icon_class: 'icon-star',
          user: app.users.getCurrentUser().get('id'),
          section: 'table'
        };

        if (!this.isBookmarked) {
          app.getBookmarks().addNewBookmark(data);
        } else {
          app.getBookmarks().removeBookmark(data);
        }

        $('#bookmarkBtn').parent().toggleClass('active');

        this.isBookmarked = !this.isBookmarked;
      }
    },

    changeViewTo: function(viewId) {
      if (this.state.viewId === viewId) {
        return;
      }

      _.each(this.state.views, function(view) {
          _.result(view, 'disable');
      });

      this.state.viewId = viewId;
      var newView = this.getCurrentView();
      _.result(newView, 'enable');

      this.table = newView;
      this.render();
    },

    getCurrentView: function() {
      var viewId = this.state.viewId;

      if (this.state.views[viewId]) {
        return this.state.views[viewId];
      }

      this.state.views[viewId] = ListViewManager.getView(viewId, {
        collection: this.collection,
        navigate: true,
        maxColumns: 8,
        toolbar: true,
        fixedHead: true,
        baseView: this,
        showMoreButton: !! _.result(this, 'rightPane')
      });

      return this.state.views[viewId];
    },

    beforeRender: function() {
      this.setView('#page-content', this.table);
      this.tryFetch();

      BasePageView.prototype.beforeRender.apply(this, arguments);
    },

    afterRender: function() {
      // Listen to preferences sync after the first sync
      this.listenToOnce(this.collection.preferences, 'sync', function() {
        this.listenTo(this.collection.preferences, 'sync', function() {
          app.trigger('tables:preferences', this, this.collection);
        });
      });
    },

    initialize: function() {
      this.widgets = {};
      this.state = {
        viewId: this.collection.table.get('list_view'),
        views: {}
      };

      this.table = this.getCurrentView();

      this.headerOptions.route.title = this.collection.table.id;
      if (!this.collection.options) {
        this.collection.options = {};
      }

      this.collection.options['sort'] = false;

      this.collection.on('select', function() {
        var $checks = this.table.$('.js-select-row');
        var $checksChecked = this.table.$('.js-select-row:checked');
        // @NOTE: Hotfix render on empty selection
        var render = this.showDeleteButton && !($checksChecked.length >= 1);

        if ($checksChecked.length != $checks.length) {
          this.table.tableHead.$('#checkAll').prop('checked', false)
        }

        this.actionButtons = $checksChecked.length;
        this.batchEdit = $checksChecked.length > 1;
        this.showDeleteButton = $checksChecked.length >= 1;
        this.showBulkEditButton = $checksChecked.length > 1;

        if (render || this.showDeleteButton || this.showBulkEditButton) {
          this.reRender();
        }
      }, this);

      this.collection.on('sort', function() {
        if (this.leftSecondaryCurrentState !== 'default') {
          this.leftSecondaryCurrentState = 'default';
          this.reRender();
        }
      }, this);

      this.isBookmarked = app.getBookmarks().isBookmarked(this.collection.table.id);
      this.showDeleteButton = false;
      this.showBulkEditButton = false;

      this.listenTo(this, 'rightPane:load', function() {
        this.listenTo(this.rightPaneView, 'view:change', function(viewId) {
          this.changeViewTo(viewId);
        });

        this.listenTo(this.rightPaneView, 'input:change', function(name, value) {
          this.trigger('rightPane:input:change', name, value);
        });

        // @TODO: Make this cleaner.
        // This events are only available for table view mode
        this.listenTo(this.rightPaneView, 'spacing:change', function(spacing) {
          if (this.table.setSpacing) {
            this.table.setSpacing(spacing);
          }
        });
      })
    }
  });
});
