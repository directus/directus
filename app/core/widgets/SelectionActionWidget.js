define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <ul class="tools left"> \
        <li><span class="action">Active</span></li> \
        <li><span class="action">Draft</span></li> \
        <li><span class="action">Delete</span></li> \
        <hr></hr> \
        <li><span class="action">Batch Edit</span></li> \
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