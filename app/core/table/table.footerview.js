define([
  'app',
  'backbone',
  'helpers/ui'
],

function(app, Backbone, UIHelper) {

  "use strict";

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
      // get whitelisted columns first
      var blacklist = this.options.blacklist || [];
      var columns = _.filter(this.options.parentView.getTableColumns(), function(column) {
        return ! _.contains(blacklist, column);
      });

      var hasANumericColumn = false;
      columns = _.map(columns, function(column) {
        var columnInfo = this.collection.structure.get(column);
        var showFooter = this.options.showFooter || columnInfo.options.get('footer') === true;
        var isANumericColumn = UIHelper.supportsNumeric(columnInfo.get('type'));

        if (isANumericColumn) {
          hasANumericColumn = true;
        }

        var col = {
          title: column,
          showFooter: isANumericColumn && showFooter,
          selectedFunction: this.functions.hasOwnProperty(column) ? this.functions[column] : 'SUM'
        };

        col.otherFunctions = _.without(['MIN', 'MAX', 'AVG', 'SUM'], col.selectedFunction);

        if (col.showFooter) {
          col.value = this.calculate(this.collection.pluck(column), col.selectedFunction);
        }

        return col;
      }, this);

      return {
        columns: columns,
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
