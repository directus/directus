define([
  'app',
  'backbone',
  'handlebars'
],
function(app, Backbone, Handlebars) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <button type="button" class="tool-item large-circle"> \
        <span class="icon icon-search"></span> \
      </button> \
      <input type="text" value="keyword">'
    ),

    tagName: 'li',
    attributes: {
      'class': 'tool input-and-button'
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
