define([
  'backbone'
],
function(Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' \
      <span for="status"> \
        <span type="button" class="tool-item large-circle"> \
          <span class="icon icon-check"></span> \
        </span> \
        <span class="simple-select"> \
          <span class="icon icon-triangle-down"></span> \
          <select name="status"> \
            <option>Save Changes</option> \
            <option>Save Changes</option> \
            <option>Save Changes</option> \
          </select> \
        </span> \
      </span>'
    ),

    tagName: 'li',
    attributes: {
      'class': 'input-and-button'
    },

    serialize: function() {
      return this.options.widgetOptions;
    }
  });
});