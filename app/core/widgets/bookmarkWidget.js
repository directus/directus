define([
  'backbone'
],
function(Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile('<button class="tool-item large-circle" id="bookmark" title="bookmark"><span class="icon icon-star"></span></button>'),

    tagName: 'li',
    attributes: {
      'class': 'input-and-button'
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    afterRender: function() {
      if(this.options.widgetOptions.active) {
        $(this.el).addClass('active');
      }
    }
  });
});