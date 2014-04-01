define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile('<span class="simple-select vertical-center"> \
      <span class="icon icon-triangle-down"></span> \
      <select id="visibilitySelect" name="status"> \
        <option value="1,2">View All</option> \
        <option value="1">View Active</option> \
        <option value="2">View Inactive</option> \
        <option value="0">View Trash</option> \
      </select> \
    </span>'),

    tagName: 'div',
    attributes: {
      'class': 'tool div-right'
    },

    events: {
      'change #visibilitySelect': function(e) {
        var value = $(e.target).val();
        this.collection.setFilter({currentPage: 0, active: value});
        this.collection.fetch();
        this.collection.preferences.save({active: value});
      },
    },


    serialize: function() {
      return this.options.widgetOptions;
    },

    afterRender: function() {
      $('#visibilitySelect').val(this.collection.preferences.get('active'));
    }
  });
});