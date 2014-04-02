define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <ul class="tools left big-space"> \
        <li class="tool"><span class="action">Active</span></li> \
        <li class="tool"><span class="action inactive">Draft</span></li> \
        <li class="tool div-right"><span class="action delete">Delete</span></li> \
        {{#if batchEdit}} \
        <li class="tool"><span class="action">Batch Edit</span></li> \
        {{/if}} \
      </ul> \
    '),

    tagName: 'li',
    attributes: {
      'class': 'input-and-button'
    },

    serialize: function() {
      return this.options.widgetOptions;
    },
    initialize: function() {
      if(!this.options.widgetOptions) {
        this.options.widgetOptions = {};
      }
      this.collection.on('select', function() {
        var batchEdit = $('.select-row:checked').length > 1;
        if(this.options.widgetOptions.batchEdit != batchEdit) {
          this.options.widgetOptions.batchEdit = batchEdit;
          this.render();
        }
      }, this);
    }
  });
});