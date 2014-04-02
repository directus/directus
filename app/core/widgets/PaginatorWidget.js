define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({

    template: Handlebars.compile('<div class="btn-group"> \
  <a class="btn btn-round {{#unless pagePrev}}disabled{{/unless}} pag-prev"><span class="icon icon-triangle-left"></span></a> \
  <a class="btn btn-round {{#unless pageNext}}disabled{{/unless}} pag-next"><span class="icon icon-triangle-right"></span></a> \
</div>'),

    events: {
      'click a.pag-next:not(.disabled)': function() {
        var page = this.collection.getFilter('currentPage') + 1;
        this.collection.filters.currentPage = page;
        this.collection.fetch();
      },

      'click a.pag-prev:not(.disabled)': function() {
        var page = this.collection.getFilter('currentPage') - 1;
        this.collection.filters.currentPage = page;
        this.collection.fetch();
      }
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    updatePaginator: function() {
      this.options.totalCount = this.collection.getTotalCount();
      this.options.widgetOptions.pageNext = (this.collection.getFilter('currentPage') + 1 < (this.options.totalCount / this.collection.getFilter('perPage') ) );
      this.options.widgetOptions.pagePrev = (this.collection.getFilter('currentPage') !== 0);
      this.render();
    },

    initialize: function() {
      this.options.widgetOptions = {};
      this.updatePaginator();
      this.collection.on('sync add remove', this.updatePaginator, this);
    }

  });

});