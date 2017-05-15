define([
  'app',
  'underscore',
  'backbone',
  'core/notification',
  'core/t',
  'helpers/table',
  'helpers/model',
  'core/table/table.headview',
  'core/table/table.bodyview',
  'core/table/table.footerview',
  'plugins/jquery.flashrow'
],

function(app, _, Backbone, Notification, __t, TableHelpers, ModelHelper, TableHead, TableBody, TableFooter) {

  'use strict';

  var TableView = Backbone.Layout.extend({
    tagName: 'div',

    template: 'tables/table',

    state: {},

    events: {
      // TODO: make those element to stop propagation to avoid this nesting
      'click tbody td:not(.js-check):not(.status):not(.js-sort)' : function (event) {
        var id = $(event.currentTarget).closest('tr').data('id');
        if (!this.options.navigate) {
          return;
        }

        // custom on click event handler
        if (this.options.onItemClick) {
          this.options.onItemClick(id);
        } else {
          this.collection.off();
          this.navigate(id);
        }
      }
    },

    TableBody: TableBody,

    serialize: function() {
      return {
        columns: this.options.columns,
        id: this.collection.table.id,
        selectable: this.options.selectable,
        hasSortColumn: this.options.sort,
        sortable: this.options.sortable,
        disabledSorting: !this.sortable,
        spacing: this.getSpacing(),
        fixedHead: this.options.fixedHead,
        showEmptyMessage: (this.getTableCollection().visibleCount(true) === 0 && !this.options.hideEmptyMessage)
      };
    },

    navigate: function (id) {
      var route = Backbone.history.fragment.split('/');

      route.push(id);
      app.router.go(route);
    },

    selection: function() {
      var selection = [];

      this.$('td .js-select-row:checked').each(function () {
        selection.push(parseInt(this.value, 10));
      });

      return selection;
    },

    beforeRender: function() {
      var options;
      this.startRenderTime = new Date().getTime();

      if (this.tableHead) {
        options = this.options;
        options.parentView = this;

        if (!this.tableHeadView) {
          this.tableHeadView = new TableHead(options);
        }

        this.insertView('table', this.tableHeadView);
      }

      if (this.collection.length > 0) {
        options = _.pick(this.options, 'collection', 'systemCollection', 'system', 'selectable', 'filters', 'preferences', 'structure', 'sort', 'deleteColumn', 'rowIdentifiers', 'saveAfterDrop', 'blacklist', 'highlight', 'columns');
        options.parentView = this;

        if (!this.tableBodyView) {
          this.tableBodyView = new this.TableBody(options);
        }

        this.insertView('table', this.tableBodyView);
      }

      if (this.collection.length > 0 && this.options.footer !== false) {
        this.insertView('table', new TableFooter(this.options));
      }
    },

    flashItemID: undefined,

    bodyScrollTop: undefined,

    flashItem: function(entryID, bodyScrollTop) {
      this.flashItemID = entryID;
      this.bodyScrollTop = parseInt(bodyScrollTop, 10) || 0;
    },

    fixWidths: function ($el) {
      var $table = $el || this.$el;
      TableHelpers.fixWidths($table);
    },

    headerScroll: function ($el) {
      var $table = $el || this.$el;
      TableHelpers.headerScroll($table);
    },

    bindTableEvents: function () {
      var $el = $('#page-content');

      this.fixWidths($el);
      this.headerScroll($el);

      var onScroll = _.bind(function () {
        this.headerScroll($el);
      }, this);

      var onResize = _.bind(function () {
        this.fixWidths($el);
        this.headerScroll($el);
      }, this);

      $el.off('scroll', onScroll);
      $el.on('scroll', onScroll);

      $(window).off('resize', _.debounce(onResize, 300));
      $(window).on('resize', _.debounce(onResize, 300));
    },

    afterRender: function() {
      this.bindTableEvents();

      if (this.bodyScrollTop) {
        document.body.scrollTop = this.bodyScrollTop;
      }

      this.bodyScrollTop = undefined;
      app.on('load', function() {
        if(this.flashItemID) {
          this.$el.find('tr[data-id="' + this.flashItemID + '"]').flashRow();
        }
        this.flashItemID = undefined;
      }, this);
    },

    initializeDrop: function() {
      //Cache a reference to the this.$el
      var $el = this.$el;
      var collection = this.collection;
      var saveAfterDrop = this.saveAfterDrop;

      // This timer prevent's the overlay to flicker when dragleave leaves for
      // a child item that triggers dragenter again.
      var timer;

      // If collection supports dnd
      // Since dragenter sux, this is how we do...
      $el.on('dragover', function(e) {
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $el.addClass('dragover');
      });

      $el.on('dragleave', function(e) {
          clearInterval(timer);
          timer = setInterval(function(){
            $el.removeClass('dragover');
            console.log('leave');
            clearInterval(timer);
          },50);
      });

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      this.el.ondrop = _.bind(function (event) {
        event.stopPropagation();
        event.preventDefault();

        app.sendFiles(event.dataTransfer.files, function (data) {
          _.each(data, function (item) {
            var table = app.schemaManager.getTable('directus_users');
            item.user = app.users.getCurrentUser().id;
            item[table.getStatusColumnName()] = table.getStatusDefaultValue();
            // item[app.statusMapping.status_name] = app.statusMapping.active_num;

            if (saveAfterDrop) {
              //@todo: update collection status count
              collection.create(item);
            } else {
              collection.add(item, {nest: true, parse: true});
            }
          });
        });
        $el.removeClass('dragover');
      }, this);
    },

    getTableColumns: function() {
      var structure = this.collection.structure,
          blacklist = this.options.blacklist || [],
          columns;

      columns = _.filter(this.collection.getColumns(), function(col) {
        var columnModel = structure.get(col),
            hiddenList = (columnModel && columnModel.get('hidden_list') !== true);

        return !_.contains(blacklist, col) && hiddenList;
      });

      return columns;
    },

    getTableCollection: function () {
      return this.options.system === true ? this.options.systemCollection : this.collection;
    },

    toggleSortable: function() {
      if (this.sortableWidget.options.sort) {
        this.disableSortable();
        Notification.info(__t('table_sort_disabled'), '<i>'+__t('table_sort_disabled_message')+'</i>', {timeout: 3000});
      } else {
        // hotfix: do not enable sort when there multiple pages
        if (this.collection.getTotalCount() > this.collection.rowsPerPage) {
          Notification.warning(__t('table_sort_disabled'), '<i>'+__t('table_sort_multiple_pages_message')+'</i>', {timeout: 6000});
          return;
        }

        this.enableSortable();
        Notification.info(__t('table_sort_enabled'), '<i>'+__t('table_sort_enabled_message')+'</i>', {timeout: 3000});
      }
    },

    enableSortable: function() {
      this.$el.find('table').removeClass('disable-sorting').addClass('reorder-enabled');
      this.$('.js-sort-toggle').addClass('active');
      this.sortable = this.sortableWidget.options.sort = true;
      this.sortableWidget.options.disabled = false;
    },

    disableSortable: function() {
      this.$el.find('table').addClass('disable-sorting').removeClass('reorder-enabled');
      this.$('.js-sort-toggle').removeClass('active');
      this.sortable = this.sortableWidget.options.sort = false;
      this.sortableWidget.options.disabled = true;
    },

    setSpacing: function(name) {
      if (_.indexOf(app.config.get('spacings'), name) < 0) {
        return;
      }

      var $table = this.$('table');
      $table.removeClass(this.state.spacing);
      this.state.spacing = name;
      $table.addClass(this.state.spacing);
      // this.options.preferences.save({spacing: name}, {silent: true});
    },

    getSpacing: function () {
      return this.state.spacing;
    },

    initialize: function (options) {
      var collection = this.collection;
      var table = collection.table;
      var sortColumnName = table ? table.getSortColumnName() : 'sort';
      var statusColumnName = table ? table.getStatusColumnName() : app.statusMapping.get('*', true).get('status_name');

      options = _.extend({
        fixedHead: false,
        showMoreButton: false
      }, (options || {}));

      if (options.system !== true) {
        this.listenTo(collection, 'sync', this.render);
        this.listenTo(collection, 'visibility', function() {
          this.options.columns = this.getTableColumns();
          this.render();
        });
      }

      this.on('render', this.render);

      this.listenTo(app.router.v.main, 'flashItem', this.flashItem);

      this.options.preferences = this.options.preferences || collection.preferences;
      this.options.structure = this.options.structure || collection.structure;
      this.options.table = this.options.table || collection.table;
      this.options.columns = this.getTableColumns();
      this.options.fixedHead = options.fixedHead;
      this.options.showItemNumbers = options.showItemNumbers;

      if (this.options.tableHead !== false) {
        this.tableHead = true;
      }

      if (collection.length > 0) {
        this.tableHead = true;
      }

      if (this.options.sort === undefined) {
        this.options.sort = collection.hasColumn(sortColumnName) && collection.hasPermission && collection.hasPermission('bigedit') && !collection.isWriteBlacklisted(sortColumnName);
      }

      if (this.options.selectable === undefined) {
        this.options.selectable = true;
      }

      if (this.options.status === undefined) {
        this.options.status = collection.hasColumn(statusColumnName);
      }

      this.state.spacing = 'cozy';

      if (this.options.preferences) {
        // @TODO: Duplicated
        var viewOptions = this.collection.preferences.get('list_view_options');
        if (viewOptions) {
          try {
            viewOptions = JSON.parse(viewOptions);
            viewOptions = viewOptions ? viewOptions['table'] : {};
          } catch (err) {
            viewOptions = {};
            this.state.malformedOptions = true;
            console.error(__t('calendar_has_malformed_options_json'));
          }
        }

        this.options.showItemNumbers = this.getViewOptions('item_numbers');
        if (viewOptions && viewOptions['spacing']) {
          this.state.spacing = viewOptions['spacing']
        }

        this.state.spacing = viewOptions ? (viewOptions['spacing'] || 'cozy') : 'cozy';
      }

      // ==================================================================================
      // Drag and drop sort
      // ----------------------------------------------------------------------------------
      // Let remember the sortable value of the table
      // After the view is rendered this value gets set to false again
      // Not being able to sort again until it's pressed.
      // Or not letting the entries to be sort if the entries are bigger than perPage limit
      // ==================================================================================
      if (this.sortable === undefined) {
        this.sortable = false;
      }

      this.saveAfterDrop = this.options.saveAfterDrop = (options.saveAfterDrop !== undefined) ?  options.saveAfterDrop : true;

      if (this.options.droppable || collection.droppable) {
        this.initializeDrop();
      }
    },

    _configureTable: function (options) {
      this.showChart = options.showChart === true;
      this.options.systemCollection = this.collection.clone();
      this.listenTo(this.collection, 'sync', function (collection, resp, options) {
        var method = options.reset ? 'reset' : 'set';
        options.parse = true;
        this.options.systemCollection[method](resp, options);

        // force render the table again
        this.trigger('render');
      });
    },

    constructor: function (options) {
      Backbone.Layout.__super__.constructor.call(this, options);

      this._configureTable(options);
    }
  });

  return TableView;
});
