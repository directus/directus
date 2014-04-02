define([
  'app',
  'backbone',
  'core/PreferenceModel'
],
function(app, Backbone, PreferenceModel) {

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
          {{#snapshots}} \
          <option data-snapshot-create value="{{this}}">{{this}}</option> \
          {{/snapshots}} \
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
          this.options.widgetOptions.snapshots.push(name);
          this.collection.preferences.unset('id');
          this.collection.preferences.set({title: name});
          this.collection.preferences.save();
        } else if($target.attr('data-snapshot') !== undefined && $target.attr('data-snapshot') !== false) {
          console.log("Snapshot Picked")
        }
      },
    },

    serialize: function() {
      console.log(this.options.widgetOptions);
      return this.options.widgetOptions;
    },

    afterRender: function() {
      $('#visibilitySelect').val(this.collection.preferences.get('active'));
    },
    initialize: function() {
      var that = this;
      this.collection.preferences.on('sync', function() {
        that.collection.fetch();
      });

      var activeTable = this.collection.table.id;

      this.options.widgetOptions = {snapshots: []};

      var that = this;
      $.get(app.API_URL + "preferences/" + activeTable, null, function(data) {
        data.forEach(function(preference){
          that.options.widgetOptions.snapshots.push(preference.title);
        });
        that.render();
      });
    }
  });
});