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
          <option data-snapshot value="{{this}}">{{this}}</option> \
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
          var that = this;
          //Check for Duplicate
          this.options.widgetOptions.snapshots.forEach(function(snapshot) {
            if(name == snapshot) {
              alert('A Snapshot With that name already exists!');
              return;
            }
          });

          if(name === null || name === "") {
            alert('Please Fill In a Valid Name');
            return;
          }

          this.options.widgetOptions.snapshots.push(name);

          //Save id so it can be reset after render
          this.defaultId = this.collection.preferences.get('id');
          //Unset Id so that it creates new Preference
          this.collection.preferences.unset('id');

          this.collection.preferences.set({title: name});

          this.collection.preferences.save();
        } else if($target.attr('data-snapshot') !== undefined && $target.attr('data-snapshot') !== false) {
          this.collection.preferences.fetch({newTitle: $target.val()});
        }
      },
    },

    serialize: function() {
      return this.options.widgetOptions;
    },

    afterRender: function() {
      if(this.collection.preferences.get('title') !== null) {
        $('#visibilitySelect').val(this.collection.preferences.get('title'));
        this.collection.preferences.set({title:null, id: this.defaultId});
      } else {
        $('#visibilitySelect').val(this.collection.preferences.get('active'));
      }
    },
    initialize: function() {
      this.collection.preferences.on('sync', function() {
        this.collection.fetch();
        this.render();
      }, this);

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