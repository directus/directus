define([
  'app',
  'backbone',
  'handlebars'
],
function(app, Backbone, Handlebars) {

  "use strict";

  return Backbone.Layout.extend({

    template: Handlebars.compile('{{#if lBound}}{{number lBound}}–{{number uBound}} of {{number totalCount}}{{else}}{{t "widget_pagination_count_no_items_found"}}{{/if}}'),

    tagName: 'div',

    attributes: {
      class: 'tool vertical-center pagination-number'
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    updateCount: function() {
      var data = {};
      data.totalCount = this.collection.getTotalCount();
      data.lBound = Math.min(this.collection.getFilter('currentPage') * this.collection.getFilter('perPage') + 1, data.totalCount);
      data.uBound = Math.min(data.totalCount, data.lBound + this.collection.getFilter('perPage') - 1);

      if(this.collection.length < (data.uBound - data.lBound) + 1) {
        if(this.collection.length < this.collection.getFilter('perPage')) {
          data.totalCount = this.collection.length;
        } else {
          data.totalCount = "Many";
        }
        data.lBound = Math.min(this.collection.getFilter('currentPage') * this.collection.getFilter('perPage') + 1, data.totalCount);
        data.uBound = Math.min(data.totalCount, data.lBound + this.collection.getFilter('perPage') - 1);
      }
      if(this.collection.length >= this.collection.getFilter('perPage') && this.collection.filters.adv_search && this.collection.filters.adv_search.length > 0) {
        data.totalCount = "Many";
      }

      this.options.widgetOptions = data;
      this.render();
    },

    initialize: function() {
      this.options.widgetOptions = {};
      this.updateCount();
      this.collection.on('sync', this.updateCount, this);
    }
  });
});
