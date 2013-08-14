//  Date core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// Attribute          Type              Contains                                Example
// -------------------------------------------------------------------------------------------------------------------------------------
// options.schema     Backbone.Model    Structure/Schema for this table row     options.schema.get('type') [column_name, comment, type]
// options.model      Backbone.Model    Data/Model for this table row           options.model.get('id') [any column in current table row]
// options.value      String            Value for this field
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('length') [any key from this UI options]
// options.name       String            Field name


define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'directus_columns';
  Module.dataTypes = ['VARCHAR'];

  Module.variables = [];

  var template =  '<label>{{capitalize name}} <span class="note">{{note}}</span></label>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {},

    serialize: function() {
      return {
        name: this.options.name,
        note: this.options.schema.get('comment')
      };
    },

    initialize: function() {

    }

  });

  Module.validate = function(value) {
    //
  };

  Module.list = function(options) {
    return options.value;
  };

  return Module;

});