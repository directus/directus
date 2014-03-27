define([
  "app",
  "backbone",
  "jquery-ui"
],

function(app, Backbone) {

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
        $(e.target).closest('.footer-function').find('ul').removeClass('collapse');
      },
      'mouseout .footer-function': function(e) {
        $(e.target).closest('.footer-function').find('ul').addClass('collapse');
      },
      'click .footer-function li': function(e) {
        this.functions[$(e.target).closest('.footer-function').attr('data-column')] = $(e.target).text();
        this.render();
      }
    },

    calculate: function(set, operation) {
      var sum = _.reduce(set, function(memo, num){ return memo + num; }, 0);
      switch(operation) {
        case 'MIN':
          return _.min(set);
        case 'MAX':
          return _.max(set);
        case 'AVG':
          return Math.round(100 * sum / set.length) / 100;
        case 'SUM':
          return sum;
      }
    },

    serialize: function() {
      var columns = _.map(this.collection.getColumns(), function(value) {
        var col = {
          title: value,
          isNumeric: this.collection.structure.get(value).get('ui') === 'numeric',
          selectedFunction: this.functions.hasOwnProperty(value) ? this.functions[value] : 'SUM'
        };
        if (col.isNumeric) col.value = this.calculate(this.collection.pluck(value), col.selectedFunction);
        return col;
      }, this);
      return {columns: columns, selectable: this.options.selectable, sortable: this.options.sortable};
    }
  });

  return TableFooterView;

});