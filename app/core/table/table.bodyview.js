define([
  'app',
  'backbone',
  'underscore',
  'sortable',
  'core/notification'
],

function(app, Backbone, _, Sortable, Notification) {

  'use strict';

  var TableBodyView = Backbone.Layout.extend({
    tagName: 'tbody',

    // To prevent this view from being removed from its parent
    // set the keep flag on
    keep: true,

    template: 'tables/table-body',

    attributes: {
      class: 'drag-and-drop batch-selectable'
    },

    events: {
      'change td.js-check > input': 'select',
      'click .js-sort': function (event) {
        event.stopPropagation();
        event.preventDefault();
      },
      'mousedown .js-sort': function (event) {
        if (!this.parentView.sortable) {
          Notification.info('Sorting Disabled', '<i>Click the icon in the header above to enable sorting</i>', {timeout: 4000});
        }
      }
    },

    select: function (event) {
      var $target = $(event.currentTarget);
      var $row = $target.closest('tr');

      if ($target.is(':checked')) {
        this.selectedIds.push($row.data('id'));
        $row.addClass('selected');
      } else {
        var index = this.selectedIds.indexOf($row.data('id'));
        if (index >= 0) {
          this.selectedIds.splice(index, 1);
        }

        $row.removeClass('selected');
      }

      this.collection.trigger('select');
    },

    serialize: function () {
      var rowIdentifiers, models, rows;
      var table = this.collection.table;
      var statusValues = this.collection.getFilter('status') || table.getStatusVisibleValues().join(',');
      var highlightIds = this.options.highlight || [];
      var collection = this.parentView.getTableCollection();

      rowIdentifiers = this.options.rowIdentifiers;

      // Filter active/inactive/deleted items
      statusValues = _.map(statusValues, Number);
      models = collection.filter(function (model) {
        if (model.has(model.table.getStatusColumnName())) {
          return _.indexOf(statusValues, Number(model.getStatusValue())) > -1;
        } else {
          return true;
        }
      });

      //Evaluate filter object
      var expressions = this.options.filters.expressions;
      var booleanOperator = this.options.filters.booleanOperator || 'AND';

      if (expressions !== undefined) {
        models = _.filter(models, function(model) {
          var tests = [];
          var result = false;

          // Evaluate each filter
          _.each(expressions, function(expression) {
            var columnValue = model.get(expression.column, {flatten: true});
            tests.push(app.evaluateExpression(columnValue, expression.operator, expression.value));
          });

          switch (booleanOperator) {
            case '||': return _.contains(tests, true);
            case '&&': return _.every(tests,_.identity);
          }

        });
      }

      rows = _.map(models, function (model, i) {
        var classes = _.map(rowIdentifiers, function (columnName) { return 'row-'+columnName+'-'+model.get(columnName); });
        var highlight = _.contains(highlightIds, model.id);
        var selected = _.contains(this.selectedIds, model.id);
        var selectable = true;

        if (this.options.isModelSelectable) {
          selectable = this.options.isModelSelectable(model);
        }

        return {
          index: i+1,
          model: model,
          classes: classes,
          highlight: highlight,
          selectable: selectable,
          selected: selected
        };
      }, this);

      var tableData = {
        columns: this.parentView.getTableColumns(),
        showItemNumbers: this.parentView.options.showItemNumbers,
        rows: rows,
        status: this.parentView.options.status,
        sortable: this.options.sort,
        selectable: this.options.selectable,
        showRemoveButton: this.options.showRemoveButton
      };

      var blacklist = this.options.blacklist;

      tableData.columns = _.difference(tableData.columns, blacklist);

      return tableData;
    },

    drop: function () {
      // NOTE: This code is duplicated in columns interface
      var collection = this.parentView.getTableCollection();
      var table = collection.table;

      // NOTE: the structure of a junction record is the related record
      // This will need to be fixed to the structure will be the junction structure
      // and the related structure will be relatedStructure or similar
      // If the junctionStructure property exists then it means it's a junction collection
      // and the it needs to use the junction table instead
      if (collection.junctionStructure) {
        table = collection.junctionStructure.table;
      }

      // if we are dropping something it means we allowed sorting
      // and the collection has a sort column
      var sortColumnName = table ? table.getSortColumnName() : 'sort';
      var self = this;
      var success;

      this.$('tr').each(function (i) {
        // Use data-id instead of data-cid
        // As collection models will be synced from the server its cid will be generated again
        // But the dom element will be still pointing to the older cid
        var attributes = {};
        var $el = $(this);

        attributes[sortColumnName] = i;
        collection.get($el.data('id')).set(attributes, {silent: true});
      });

      success = function () {
        collection.setOrder(sortColumnName, 'ASC', {silent: false});
      };

      if (this.options.saveAfterDrop) {
        // collection.save({columns:['id','sort']});
        collection.save(null, {
          attributes: ['sort'],
          wait: true,
          patch: true,
          success: success
        });
      } else {
        success();
      }
    },

    initialize: function(options) {
      this.options.filters = this.options.filters || {};
      this.sort = this.options.structure.get('sort') || options.sort;
      this.selectedIds = [];

      var collection = options.system == true ? this.options.systemCollection : this.collection;
      this.listenTo(collection, 'sort', this.render);
      this.parentView = options.parentView;

      if (this.sort) {
        var container = this.$el[0];
        var that = this;
        options.parentView.sortableWidget = new Sortable(container, {
          animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
          handle: '.js-sort', // Restricts sort start click/touch to the specified element
          draggable: 'tr', // Specifies which items inside the element should be sortable
          ghostClass: 'sortable-ghost',
          sort: false,
          disabled: true,
          onStart: function (evt) {
            //var dragItem = jQuery(evt.item);
            var tbody = jQuery(container);
            tbody.addClass('remove-hover-state');
            tbody.removeClass('disable-transform');
          },
          onEnd: function (evt) {
            //var dragItem = jQuery(evt.item);
            var tbody = jQuery(container);
            tbody.removeClass('remove-hover-state');
            tbody.addClass('disable-transform');
          },
          onUpdate: function (evt){
            // app.router.openModal({type: 'confirm', text: 'Are you sure you want to reorder these items?', callback: function() {
            //   that.drop();
            // }});
            that.drop();
          }
        });

        if (options.parentView.sortable) {
          options.parentView.enableSortable();
        }
      }
    }
  });

  return TableBodyView;
});
