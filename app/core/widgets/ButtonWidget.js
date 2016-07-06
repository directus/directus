define([
  'app',
  'backbone',
  'handlebars'
],
function(app, Backbone, Handlebars) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <button type="button" id="{{buttonId}}" class="tool-item btn btn-header {{buttonClass}}"> \
        <i class="material-icons">{{iconClass}}</i> {{buttonText}} \
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
