define([
  'app',
  'underscore',
  'backbone',
  'helpers/ui'
],

function(app, _, Backbone, UIHelper) {

  'use strict';

  var TableFooterView = Backbone.Layout.extend({
    tagName: 'tfoot',
    template: 'tables/table-foot',

    functions: {},

    events: {
      'change select': function(e) {
        var $target = $(e.target);
        var operation = $target.find(":selected").val().toLowerCase();
        var column = $(e.target).attr('data-id');
        var set = this.collection.pluck(column);
        var value = this.calculate(set, operation);
        $target.next('p').html(value);
      },
      'mouseover .footer-function': function(e) {
        $(e.target).closest('.footer-function').find('ul').removeClass('hide');
      },
      'mouseout .footer-function': function(e) {
        $(e.target).closest('.footer-function').find('ul').addClass('hide');
      },
      'click .footer-function li': function(e) {
        this.functions[$(e.target).closest('.footer-function').attr('data-column')] = $(e.target).text();
        this.render();
        this.options.parentView.fixWidths();
      }
    },

    calculate: function(set, operation) {
      var sum = _.reduce(set, function(memo, num){
        return Number(memo) + Number(num);
      }, 0);
      switch(operation) {
        case 'MIN':
          return String(_.min(set)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        case 'MAX':
          return String(_.max(set)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        case 'AVG':
          return String(Math.round(100 * sum / set.length) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        case 'SUM':
          return String(sum).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
    },

    serialize: function() {
      var hasANumericColumn = false;
      // get whitelisted columns first
      var blacklist = this.options.blacklist || [];
      var columns = _.filter(this.options.parentView.getTableColumns(), function (column) {
        return ! _.contains(blacklist, column);
      });

      columns = _.map(columns, function (column) {
        var columnInfo = this.collection.structure.get(column);
        var showFooter, isANumericColumn, isRelationalColumn;

        if (!columnInfo) {
          return {};
        }

        showFooter = this.options.showFooter || columnInfo.options.get('footer') === true;
        isANumericColumn = UIHelper.supportsNumeric(columnInfo.get('type'));
        // Omit M2O column which can be numeric
        isRelationalColumn = columnInfo.isRelational();

        if (isANumericColumn) {
          hasANumericColumn = true;
        }

        var col = {
          title: column,
          showFooter: isANumericColumn && showFooter && !isRelationalColumn,
          functionsValues: [],
          selectedFunction: this.functions.hasOwnProperty(column) ? this.functions[column] : 'SUM'
        };

        if (col.showFooter) {
          var functions = ['MIN', 'MAX', 'AVG', 'SUM'];
          var self = this;
          _.each(functions, function (name) {
            col.functionsValues.push({
              name: name,
              selected: name === col.selectedFunction,
              value: self.calculate(self.collection.pluck(column), name)
            });
          });
        }

        return col;
      }, this);

      return {
        columns: columns,
        showItemNumbers: this.options.showItemNumbers,
        selectable: this.options.selectable,
        sortable: this.options.sort,
        hasANumericColumn: hasANumericColumn
      };
    },

    initialize: function(options) {
      if (this.collection.preferences) {
        this.collection.preferences.on('change:columns_visible', this.render, this);
      }
    }
  });

  return TableFooterView;

});
