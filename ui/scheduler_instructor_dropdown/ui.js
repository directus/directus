//  Many To One core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'scheduler_instructor_dropdown';
  Module.dataTypes = ['INT'];

  Module.variables = [
   
  ];

  var template = '<label>{{capitalize name}} <span class="note">{{comment}}</span></label> \
                  <select name="{{name}}"> \
                  <option value="">Select from below</option> \
                  {{#data}}<option value="{{id}}" {{#if selected}}selected{{/if}}>{{name}}</option>{{/data}} \
                  </select>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    serialize: function() {
      var data = this.collection.map(function(model) {
        return {
          id: model.id,
          name: model.get(this.column),
          selected: this.options.value !== undefined && (model.id === this.options.value.id)
        };
      }, this);

      // default data while syncing (to avoid flickr when data is loaded)
      if (this.options.value !== undefined && this.options.value.id && !data.length) {
        data = [{
          id: this.options.value.id,
          name: this.options.value.get(this.column),
          selected: true
        }];
      }

      return {
        name: this.options.name,
        data: data,
        comment: this.options.schema.get('comment')
      };
    },

    initialize: function(options) {
      _.bindAll(this, 'load_instructors', 'process_instructors');
      $('#datetime').live('change', this.load_instructors);

    },

    load_instructors: function() {
      var that = this;
      var instructor_id = $('select[name=instructor_id]').val();
      console.log($('select[name=room_id]').val(), $('select[name=instructor_id]').val());
      // we will hit the scheduler API for this I suppose, since we don't really have a different perfect place for it...
       $.ajax({
          url: app.API_URL + 'extensions/scheduler/get_instructor_list_with_conflicts/' + $('#datetime').val() + '/' + $('select[name=room_id]').val() + '/' + $('select[name=instructor_id]').val(),
          type: 'get',
          dataType: 'json',
          success: function(res) {
            that.process_instructors(res, instructor_id)
          }
      });
    },

    process_instructors: function(res, instructor_id) {
      var that = this;
      //console.log(that.$('select'));
      that.$('select').empty();
      this.$('select').append('<option value="">Please select an instructor from the list below.</option>');
      _.each(res, function(instructor) {
        console.log(instructor);
        if (instructor.status == "available") {
          var opt_string = "<option value='" + instructor.id + "'";
          if (instructor.id === instructor_id) {
            opt_string += " selected ";
          }
          opt_string += ">" + instructor['last_name'] + ", " + instructor['first_name'] + "</option>";
          that.$('select').append(opt_string);
        } else if (instructor.status == "conflict") {
          that.$('select').append("<option value='" + instructor.id + "' class='red' disabled>" + instructor['last_name'] + ", " + instructor['first_name'] + " (already teaching at: " + instructor.room_title + ")</option>");
        }
        
      }, this);

    }

  });

  Module.validate = function(value, options) {

    if (!options.schema.isNullable()) {
      // a numer is ok
      if (!_.isNaN(parseInt(value,10))) {
        return;
      }
      //empty is not ok
      if (_.isEmpty(value)) {
        return 'The field cannot be empty';
      }
      // model value without proper id is not ok
      if (value instanceof Backbone.Model && _.isNaN(value.get('id'))) {
        return 'The field cannot be empty';
      }
    }
  };

  Module.list = function(options) {
    if (options.value === undefined) return '';
    if (options.value instanceof Backbone.Model) return options.value.get(options.settings.get('visible_column'));
    return options.value;
  };

  return Module;
});