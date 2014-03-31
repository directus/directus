define([
  'backbone'
],
function(Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile(' <div class="btn-group" id="visibility"> \
      <a class="btn btn-small dropdown-toggle" data-toggle="dropdown">Viewing All<span class="caret"></span></a> \
      <ul class="dropdown-menu"> \
        <li><a data-value="1">View Active (397)</a></li> \
        <li><a data-value="2">View Inactive (3)</a></li> \
        <li><a data-value="0">View Trash (0)</a></li> \
      </ul> \
    </div>'),

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