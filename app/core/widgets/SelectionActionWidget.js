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
        <li class="tool"><span class="action">Batch Edit</span></li> \
      </ul> \
    '),

    tagName: 'li',
    attributes: {
      'class': 'input-and-button'
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    afterRender: function() {
      if(this.options.widgetOptions && this.options.widgetOptions.active) {
        $(this.el).addClass('active');
      }
    }
  });
});