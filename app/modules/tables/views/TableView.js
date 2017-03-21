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

  var headFootShadows = function ($el) {
    var pageScrollTop = $el.scrollTop();
    var scrollBottom = $el.find('table.fixed-header').height() - $el.height() - pageScrollTop + 64; // 64 is table padding
    var headScroll = Math.max(Math.min(pageScrollTop, 100), 0) / 100;
    $el.find('table.fixed-header thead').css({ boxShadow: '0px 2px 6px 0px rgba(200,200,200,'+headScroll+')' });
    var footScroll = Math.max(Math.min(scrollBottom, 100), 0) / 100;
    $el.find('table.fixed-header tfoot').css({ boxShadow: '0px -2px 6px 0px rgba(200,200,200,'+footScroll+')' });

    // Position Sticky Header
    if ($el.find('table.fixed-header').hasClass('charted')) {
      var headerDelta = ($(window).width() <= 500)? 244 : 304;
      var headerTop = Math.max(64, headerDelta - pageScrollTop); // 304 is tied to CSS/SASS (default top from charted)
      $el.find('table.fixed-header thead').css('top', headerTop);
    }
  };

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Table View',
        breadcrumbs: [{title: __t('tables'), anchor: '#tables'}]
      }
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
              buttonClass: 'blank',
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
            // this.widgets.visibilityWidget = new Widgets.VisibilityWidget({collection: this.collection, basePage: this});
          }

          return [
            // this.widgets.visibilityWidget
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

    changeViewTo: function(viewId) {
      if (this.state.viewId === viewId) {
        return;
      }

      this._ensureView(viewId, true);
    },

    _ensureView: function (viewId, triggerEvent) {
      _.each(this.state.views, function(view) {
          view.disable();
      });

      this.state.viewId = viewId;
      var newView = this.getCurrentView();
      newView.enable();

      if (triggerEvent === true) {
        this.trigger('view:changed', viewId);
      }

      this.table = newView;
      this.table.savePreferences('currentView', viewId, true);

      this.table.fetchData().done(_.bind(function () {
        this.render();
      }, this));

      // this.render();
    },

    getCurrentView: function() {
      var viewId = this.state.viewId;

      if (!this.state.views[viewId]) {
        this.state.views[viewId] = ListViewManager.getView(viewId, {
          collection: this.collection,
          navigate: true,
          maxColumns: 8,
          toolbar: true,
          fixedHead: true,
          baseView: this,
          showChart: true,
          system: true,
          showMoreButton: !! _.result(this, 'rightPane')
        });

        this.listenTo(this.state.views[viewId], 'toggleRightPane', this.toggleRightPane);
      }

      return this.state.views[viewId];
    },

    beforeRender: function() {
      this.setView('#page-content', this.table);
      // this.tryFetch({wait: true});

      BasePageView.prototype.beforeRender.apply(this, arguments);
    },

    afterRender: function() {
      // Listen to preferences sync after the first sync
      this.listenToOnce(this.collection.preferences, 'sync', function() {
        this.listenTo(this.collection.preferences, 'sync', function() {
          app.trigger('tables:preferences', this, this.collection);
        });
      });

      var $el = $('#content');
      $el.on('scroll', function () {
        headFootShadows($el);
      });

      this.table.on('afterRender', function () {
        headFootShadows($el);
      });
    },

    getCurrentViewName: function () {
      var collection = this.collection;
      var table = collection.table;
      var preferences = collection.preferences;

      return preferences.getListViewOptions('currentView') || table.get('list_view') || 'table';
    },

    initialize: function() {
      this.widgets = {};
      this.state = {
        viewId: this.getCurrentViewName(),
        views: {}
      };

      this._ensureView(this.state.viewId);
      // this.table = this.getCurrentView();

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

      this.listenTo(this, 'rightPane:load', function () {
        this.listenTo(this.rightPaneView, 'view:change', function (viewId) {
          this.changeViewTo(viewId);
        });

        this.listenTo(this.rightPaneView, 'all', function () {
          var args = Array.prototype.slice.call(arguments, 0);
          args[0] = 'rightPane:' + args[0];

          this.trigger.apply(this, args);
        });
      })
    }
  });
});
