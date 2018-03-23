define([
  'app',
  'backbone',
  'underscore',
  'utils',
  'core/t',
  'core/notification'
],

function(app, Backbone, _, Utils, __t, Notification) {

  'use strict';

  var TableHeadView = Backbone.Layout.extend({

    template: 'tables/table-head',

    tagName: 'thead',

    // To prevent this view from being removed from its parent
    // set the keep flag on
    keep: true,

    events: {
      'click input.js-select-all-row': function () {
        var checkAll = this.checkedAll = this.$('#checkAll:checked').prop('checked') !== undefined;
        var bodyView = this.parentView.tableBodyView;
        var $inputs = bodyView.$('input.js-select-row');

        bodyView.selectedIds = [];
        $inputs.prop('checked', checkAll);

        if (checkAll) {
          $inputs.each(function () {
            var $row = $(this).closest('tr');
            // TODO: Put ID into the checkbox and avoid querying it everytime
            bodyView.selectedIds.push($row.data('id'));
          });
        }

        this.collection.trigger('select');
      },

      'click .js-more': 'showMore',

      'click th:not(.js-check, .js-sort-toggle, .visible-columns-cell)': function(event) {
        var collection = this.getCollection();
        var column = $(event.currentTarget).data('id');
        var order = collection.getOrder();
        var order_sort = 'ASC';
        var isDefaultSorting = (order.sort === column && order.sort_order !== order_sort);
        var structure = collection.junctionStructure || collection.structure;
        var defaultSortColumn = structure.where({column_name: 'sort'}).length ? 'sort' : 'id';

        if (column === 'sort' || isDefaultSorting) {
          collection.setOrder(defaultSortColumn, order_sort);
          // Note: this is a quick fix that forces Backbone to rerender columns with proper sorting
          Backbone.history.loadUrl();
          return;
        }

        if (column !== order.sort) {
          collection.setOrder(column, order_sort);
        } else {
          if(order.sort_order === order_sort) {
            order_sort = 'DESC';
          }
          collection.setOrder(column, order_sort);
        }

        // Note: this is a quick fix that forces Backbone to rerender columns with proper sorting
        Backbone.history.loadUrl();
      },

      'click .js-sort-toggle': function () {
        this.parentView.toggleSortable();
      },
      'click th:not(.js-sort-toggle)': function () {
        if (this.parentView.sortableWidget && this.parentView.sortableWidget.options.sort) {
          this.$el.closest('table').addClass('disable-sorting');
          this.parentView.sortableWidget.options.sort = false;
          Notification.info(__t('table_sort_disabled'), '<i>'+__t('table_sort_disabled_message')+'</i>', {timeout: 3000});
        }
      }
    },

    showMore: function () {
      this.parentView.trigger('onShowMore');
    },

    serialize: function() {
      var order = this.getCollection().getOrder();
      var blacklist = this.options.blacklist;
      // get whitelisted columns first
      var columns = _.filter(this.parentView.getTableColumns(), function (column) {
        return ! _.contains(blacklist, column);
      });

      columns = _.map(columns, function(column) {
        return {name: column, orderBy: column === order.sort, desc: order.sort_order === 'DESC'};
      });

      return {
        status: this.parentView.options.status,
        checkedAll: this.checkedAll,
        selectable: this.options.selectable,
        sortable: this.options.sort,
        columns: columns,
        showItemNumbers: this.options.showItemNumbers,
        showMoreButton: this.options.showMoreButton,
        showRemoveButton: this.options.showRemoveButton,
        hideColumnPreferences: this.options.hideColumnPreferences
      };
    },

    getCollection: function () {
      return this.options.system === true ? this.options.systemCollection : this.collection;
    },

    initialize: function (options) {
      var collection = this.getCollection();

      this.parentView = options.parentView;
      this.maxColumns = this.options.maxColumns || 8;

      if (collection.preferences) {
        collection.filters.columns_visible = [];
        // TODO: Add getColumnsVisible to preferences model with trimmed spaces column
        Utils.parseCSV(collection.preferences.get('columns_visible')).forEach(function(column) {
          //Only add columns that actually exist
          if (collection.structure.get(column) !== undefined) {
            collection.filters.columns_visible.push(column);
          }
        });
      }

      this.listenTo(this.getCollection(), 'sort', this.render);
    }

  });

  return TableHeadView;

});
