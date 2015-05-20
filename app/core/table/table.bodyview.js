define([
  "app",
  "backbone",
  "sortable"
],

function(app, Backbone, Sortable) {

  "use strict";

  var TableBodyView = Backbone.Layout.extend({

    tagName: 'tbody',

    template: 'tables/table-body',

    events: {
      'change td.check > input': 'select',
      'click td.check > input': function() {
        this.collection.trigger('select');
      },
      'click .sort': function(e) {
        e.cancelBubble = true;
        e.stopPropagation();
        e.preventDefault();
        return false;
      },
      'mousedown .sort': function(e) {
        if($(e.target).closest('.disable-sorting').length > 0){
          noty({text: "<b>Sorting Disabled</b><br><i>Click the reordering icon to enable</i>", type: 'information', timeout: 4000, theme: 'directus'});
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
      var rowIdentifiers, activeState, models, rows;
      var activeColumns = this.collection.getFilter('active') || "1,2";
      var highlightIds = this.options.highlight || [];

      rowIdentifiers = this.options.rowIdentifiers;

      //Filter active/inactive/deleted items
      activeState = _.map(activeColumns,Number);
      models = this.collection.filter(function(model) {
        if (model.has(app.statusMapping.status_name)) {
          return (_.indexOf(activeState, Number(model.get(app.statusMapping.status_name))) > -1);
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

      rows = _.map(models, function(model) {
        var classes = _.map(rowIdentifiers, function(columnName) { return 'row-'+columnName+'-'+model.get(columnName); });
        var highlight = _.contains(highlightIds,model.id);

        return {model: model, classes: classes, highlight: highlight};
      });

      var tableData = {
        columns: this.collection.getColumns(),
        rows: rows,
        sortable: this.options.sort,
        selectable: this.options.selectable,
        deleteColumn: this.options.deleteColumn
      };

      var blacklist = this.options.blacklist;

      tableData.columns = _.difference(tableData.columns, blacklist);

      return tableData;
    },

    drop: function() {
      var collection = this.collection;
      this.$('tr').each(function(i) {
        collection.get($(this).attr('data-id')).set({sort: i},{silent: true});
      });

      if (this.options.saveAfterDrop) {
        collection.save({columns:['id','sort']});
      }

      this.collection.setOrder('sort','ASC',{silent: true});
    },

    initialize: function(options) {
      this.options.filters = this.options.filters || {};
      this.sort = this.options.structure.get('sort') || options.sort;
      this.collection.on('sort', this.render, this);
      if (this.sort) {
        var container = this.$el[0];
        var that = this;
        options.parentView.sortableWidget = new Sortable(container, {
          animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
          handle: ".sort", // Restricts sort start click/touch to the specified element
          draggable: "tr", // Specifies which items inside the element should be sortable
          ghostClass: "sortable-ghost",
          sort: false,
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
      }
    }
  });

  return TableBodyView;

});