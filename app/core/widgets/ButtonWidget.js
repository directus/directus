define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <button type="button" id="{{buttonId}}" class="tool-item large-circle {{buttonClass}}"> \
        <span class="icon {{iconClass}}"></span> \
      </button>'
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