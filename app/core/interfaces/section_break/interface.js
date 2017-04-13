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

define([
  'core/UIView',
  'core/t'
], function(UIView, __t) {
  'use strict';

  return UIView.extend({
    template: 'section_break/input',
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
});
