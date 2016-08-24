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


define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

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

  var Input = UIView.extend({
    templateSource: template,

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
        min: this.options.settings.get('minimum'),
        max: this.options.settings.get('maximum'),
        step: this.options.settings.get('step'),
        comment: this.options.schema.get('comment')
      };
    },

    initialize: function() {
      //
    }
  });

  var Component = UIComponent.extend({
    id: 'slider',
    dataTypes: ['INT'],
    variables: [
      {id: 'minimum', type: 'Number', default_value: 0, ui: 'numeric'},
      {id: 'maximum', type: 'Number', default_value: 100, ui: 'numeric'},
      {id: 'step', type: 'Number', default_value: 1, ui: 'numeric', comment: __t('slider_step_comment')}
    ],
    Input: Input,
    validate: function(value, options) {
      // Not needed since HTML5 slider defaults to "0"
      if (options.schema.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    }
  });

  return Component;
});
