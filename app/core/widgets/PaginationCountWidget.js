define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({

    template: Handlebars.compile('{{#if lBound}}{{number lBound}}–{{number uBound}} of {{number totalCount}}{{/if}}'),

    tagName: 'div',

    attributes: {
      class: 'tool vertical-center pagination-number'
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    initialize: function() {
      this.options.widgetOptions = {};

      this.collection.on('sync add remove', function() {
        var data = {};
        data.totalCount = this.collection.getTotalCount();
        data.lBound = Math.min(this.collection.getFilter('currentPage') * this.collection.getFilter('perPage') + 1, data.totalCount);
        data.uBound = Math.min(data.totalCount, data.lBound + this.collection.getFilter('perPage') - 1);
        this.options.widgetOptions = data;
        this.render();
      }, this);
    }
  });
});