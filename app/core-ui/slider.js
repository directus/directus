//  Slider core UI component
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
/*jshint multistr: true */


define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'slider';
  Module.dataTypes = ['INT'];

  Module.variables = [
    {id: 'minimum', ui: 'numeric'},
    {id: 'maximum', ui: 'numeric'},
    {id: 'step', ui: 'numeric', comment: 'Specifies the allowed number intervals'}
  ];

  var template =  '<style type="text/css"> \
                  span.slider-value { \
                    margin-left: 10px; \
                  } \
                  input.slider { \
                    display: inline-block; \
                    vertical-align: middle; \
                  } \
                  </style> \
                  <input type="range" class="slider" value="{{value}}" name="{{name}}" id="{{name}}" min="{{min}}" max="{{max}}" step="{{step}}"> <span class="slider-value">{{value}}</span>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'change .slider': function(e) {
        var value = e.target.value;
        this.$el.find('span.slider-value').html(value);
      }
    },

    afterRender: function() {
      //
    },

    serialize: function() {

      if (this.options.model.isNew() && this.options.schema.has('default_value')) {
        this.options.value = this.options.schema.get('default_value');
      }

      return {
        value: this.options.value || '0',
        name: this.options.name,
        min: (this.options.settings && this.options.settings.has('minimum')) ? this.options.settings.get('minimum') : '0',
        max: (this.options.settings && this.options.settings.has('maximum')) ? this.options.settings.get('maximum') : '100',
        step: (this.options.settings && this.options.settings.has('step')) ? this.options.settings.get('step') : '1',
        comment: this.options.schema.get('comment')
      };
    },

    initialize: function() {
      //
    }

  });

  Module.validate = function(value, options) {
    // Not needed since HTML5 slider defaults to "0"
    if (options.schema.isRequired() && !value) {
      return 'This field is required';
    }
  };

  Module.list = function(options) {
    return options.value;
  };

  return Module;

});
