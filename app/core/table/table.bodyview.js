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

    template: 'tables/table-body',

    attributes: {
      class: 'drag-and-drop batch-selectable'
    },

    events: {
      'change td.js-check > input': 'select',
      'click td.js-check > input': function() {
        this.collection.trigger('select');
      },
      'click .js-sort': function(e) {
        e.cancelBubble = true;
        e.stopPropagation();
        e.preventDefault();
        return false;
      },
      'mousedown .sort': function(e) {
        if($(e.target).closest('.disable-sorting').length > 0){
          Notification.info('Sorting Disabled', '<i>Click the reordering icon to enable</i>', {timeout: 4000});
        }
      }
    },

    select: function(e) {
      var $target = $(e.target);

      if ($target.attr('checked') !== undefined) {
        $target.closest('tr').addClass('selected');
      } else {
        $target.closest('tr').removeClass('selected');
      }
    },

    serialize: function() {
      var rowIdentifiers, statusState, models, rows;
      var statusColumns = this.collection.getFilter('status') || '1,2';
      var highlightIds = this.options.highlight || [];
      var collection = this.options.system === true ? this.options.systemCollection : this.collection;

      rowIdentifiers = this.options.rowIdentifiers;

      //Filter active/inactive/deleted items
      statusState = _.map(statusColumns,Number);
      models = collection.filter(function(model) {
        if (model.has(app.statusMapping.status_name)) {
          return (_.indexOf(statusState, Number(model.get(app.statusMapping.status_name))) > -1);
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

      rows = _.map(models, function(model, i) {
        var classes = _.map(rowIdentifiers, function(columnName) { return 'row-'+columnName+'-'+model.get(columnName); });
        var highlight = _.contains(highlightIds,model.id);
        var table = model.table;
        var statusColumnName = table ? table.getStatusColumnName() : app.statusMapping.status_name;
        var statusDraft = model.get(statusColumnName) === app.statusMapping.draft_num;

        return {index: i+1, model: model, classes: classes, highlight: highlight, statusDraft: statusDraft};
      });

      var tableData = {
        columns: this.parentView.getTableColumns(),
        showItemNumbers: this.parentView.options.showItemNumbers,
        rows: rows,
        status: this.parentView.options.status,
        sortable: this.options.sort,
        selectable: this.options.selectable,
        deleteColumn: this.options.deleteColumn
      };

      var blacklist = this.options.blacklist;

      tableData.columns = _.difference(tableData.columns, blacklist);
      tableData.showRemoveButton = this.parentView.options.showRemoveButton;

      return tableData;
    },

    drop: function() {
      var collection = this.collection;
      var table = collection.table;
      // if we are dropping something it means we allowed sorting
      // and the collection has a sort column
      var sortColumnName = table ? table.getSortColumnName() : 'sort';

      this.$('tr').each(function (i) {
        // Use data-id instead of data-cid
        // As collection models will be synced from the server its cid will be generated again
        // But the dom element will be still pointing to the older cid
        var attributes = {};

        attributes[sortColumnName] = i;
        collection.get($(this).attr('data-id')).set(attributes, {silent: true});
      });

      if (this.options.saveAfterDrop) {
        // collection.save({columns:['id','sort']});
        var self = this;
        collection.save(null, {wait: true, patch: true, success: function() {
          self.collection.setOrder(sortColumnName, 'ASC', {silent: false});
        }});
      } else {
        this.collection.setOrder(sortColumnName, 'ASC',{silent: true});
      }
    },

    initialize: function(options) {
      this.options.filters = this.options.filters || {};
      this.sort = this.options.structure.get('sort') || options.sort;

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
