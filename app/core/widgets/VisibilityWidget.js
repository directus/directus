define([
  'backbone'
],
function(Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile('<span class="simple-select"> \
      <span class="icon icon-triangle-down"></span> \
      <select id="visibilitySelect" name="status"> \
        <option value="1,2">View All</option> \
        <option value="1">View Active</option> \
        <option value="2">View Inactive</option> \
        <option value="0">View Trash</option> \
      </select> \
    </span>'),

    tagName: 'li',
    attributes: {
      'class': 'div-right'
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