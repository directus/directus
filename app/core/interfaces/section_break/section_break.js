//  Instructions core UI component
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

  var Input = UIView.extend({
    template: 'section_break/template',
    fieldClass: function() { return this.options.settings.get('show_inline') ? false : 'break-header' },
    hideLabel: true,

    serialize: function() {
      var value = this.options.value || '';

      return {
        value: value,
        inline: this.options.settings.get('show_inline'),
        title: this.options.settings.get('title') || '',
        instructions: this.options.settings.get('instructions') || ''
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'section_break',
    dataTypes: ['VARCHAR', 'TEXT'],
    variables: [
      {
        id: 'show_inline',
        type: 'Boolean',
        default_value: false,
        ui: 'checkbox'
      },
      {
        id: 'title',
        type: 'String',
        default_value: '',
        ui: 'textinput'
      },
      {
        id: 'instructions',
        type: 'String',
        default_value: '',
        ui: 'wysiwyg',
        options: {
          'ul': true,
          'ol': true
        }
      }
    ],
    Input: Input,
    list: function(options) {
      var instructions = options.settings.get('instructions') || '...';
      var regex = /(<([^>]+)>)/ig;

      return instructions.replace(regex, "");
    }
  });

  return Component;
});
