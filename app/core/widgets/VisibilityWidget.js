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
        <optgroup label="Status"> \
          <option data-status value="1,2">View All</option> \
          <option data-status value="1">View Active</option> \
          <option data-status value="2">View Inactive</option> \
          <option data-status value="0">View Trash</option> \
        </optgroup> \
        <optgroup label="Snapshots"> \
          <option data-snapshot-create value="-1">Create Snapshot</option> \
        </optgroup> \
      </select> \
    </span>'),

    tagName: 'div',
    attributes: {
      'class': 'tool div-right'
    },

    events: {
      'change #visibilitySelect': function(e) {
        var $target = $(e.target).find(":selected");
        if($target.attr('data-status') !== undefined && $target.attr('data-status') !== false) {
          var value = $(e.target).val();
          this.collection.setFilter({currentPage: 0, active: value});
          this.collection.fetch();
          this.collection.preferences.save({active: value});
        } else if($target.attr('data-snapshot-create') !== undefined && $target.attr('data-snapshot-create') !== false) {
          var name = prompt("Please enter a name for your Snapshot");
          console.log(name);
        } else if($target.attr('data-snapshot') !== undefined && $target.attr('data-snapshot') !== false) {

        }
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