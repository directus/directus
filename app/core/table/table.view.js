define([
  "app",
  'underscore',
  "backbone",
  'core/notification',
  'core/t',
  'helpers/model',
  "core/table/table.headview",
  "core/table/table.bodyview",
  "core/table/table.footerview",
  "plugins/jquery.flashrow"
],

function(app, _, Backbone, Notification, __t, ModelHelper, TableHead, TableBody, TableFooter) {

  "use strict";

  var TableView = Backbone.Layout.extend({

    tagname: 'div',
    attributes: {'class':'directus-table-container'},
    template: 'tables/table',

    TableBody: TableBody,

    serialize: function() {
      return {
        columns: this.options.columns,
        id: this.collection.table.id,
        selectable: this.options.selectable,
        sortable: this.options.sortable,
        disabledSorting: !this.sortable,
        showEmptyMessage: (this.collection.length === 0 && !this.options.hideEmptyMessage)
      };
    },

    events: {
      'click tbody td:not(.check):not(.status):not(.sort)' : function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        if (this.options.navigate) {
          this.collection.off();
          this.navigate(id);
        }
      }
    },

    navigate: function(id) {
      var route = Backbone.history.fragment.split('/');
      route.push(id);
      app.router.go(route);
    },

    selection: function() {
      var selection = [];
      $('td.check > input:checked').each(function() { selection.push(parseInt(this.value,10)); });
      return selection;
    },

    beforeRender: function() {
      var options;
      this.startRenderTime = new Date().getTime();

      if (this.tableHead) {
        options = this.options;
        options.parentView = this;
        this.insertView('table', new TableHead(options));
      }

      if (this.collection.length > 0) {
        options = _.pick(this.options, 'collection', 'selectable', 'filters', 'preferences', 'structure', 'sort', 'deleteColumn', 'rowIdentifiers', 'saveAfterDrop', 'blacklist', 'highlight', 'columns');
        options.parentView = this;
        this.insertView('table', new this.TableBody(options));
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

    afterRender: function() {
      var now = new Date().getTime();
      //console.log('rendered table ' + this.collection.table.id + ' in '+ (now-this.startRenderTime)+' ms');

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
      this.el.ondrop = _.bind(function(e) {
        e.stopPropagation();
        e.preventDefault();

        app.sendFiles(e.dataTransfer.files, function(data) {
          _.each(data, function(item) {
            item.user = app.users.getCurrentUser().id;
            item[app.statusMapping.status_name] = app.statusMapping.active_num;

            if (saveAfterDrop) {
              //@todo: update collection status count
              collection.create(item);
            } else {
              console.log('ADD');
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
            hiddenInput = (columnModel && columnModel.get('hidden_input') !== true);

        return !_.contains(blacklist, col) && hiddenInput;
      });

      return columns;
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
      this.$el.find('table').removeClass('disable-sorting');
      this.sortable = this.sortableWidget.options.sort = true;
    },

    disableSortable: function() {
      this.$el.find('table').addClass('disable-sorting');
      this.sortable = this.sortableWidget.options.sort = false;
    },

    initialize: function(options) {
      var collection = this.collection;

      this.listenTo(collection, 'sync', function(model, resp, options) {
        options = options || {};
        if (options.silent) return;
        ModelHelper.setIdAttribute(model);
        this.render();
      });

      this.listenTo(collection, 'visibility', function() {
        this.options.columns = this.getTableColumns();
        this.render();
      });

      this.listenTo(app.router.v.main, 'flashItem', this.flashItem);

      this.options.preferences = this.options.preferences || this.collection.preferences;
      this.options.structure = this.options.structure || this.collection.structure;
      this.options.table = this.options.table || this.collection.table;
      this.options.columns = this.getTableColumns();

      if (this.options.tableHead !== false) {
        this.tableHead = true;
      }

      if(collection.length > 0) {
        this.tableHead = true;
      }

      if (this.options.sort === undefined) {
        this.options.sort = collection.hasColumn('sort') && collection.hasPermission && collection.hasPermission('bigedit') && !collection.isWriteBlacklisted('sort');
      }

      if (this.options.selectable === undefined) {
        this.options.selectable = true;
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

    constructor: function (options) {
      // Add events from child
      if (this.events) {
        this.events = _.defaults(this.events, TableView.prototype.events);
      }
      Backbone.Layout.__super__.constructor.call(this, options);
    }
  });

  return TableView;

});
