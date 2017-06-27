//  Text Input Core UI component
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
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('placeholder') [any key from this UI options]
// options.name       String            Field name
/*jshint multistr: true */

define([
  'core/UIView',
  'core/t'
], function (UIView, __t) {

  'use strict';

  return UIView.extend({
    template: 'text_input/input',

    // Event Declarations
    events: {
      // Show character counter when input gains focus
      'focus input': function() {
        this.$el.find('.char-count').removeClass('hide');
      },
      // Update character counter when input changes
      'input input': 'onChangeInput',
      // Validate keypress against validation_string
      'keypress input': 'validateString',
      // Hide character counter when input loses focus
      'blur input': function() {
        this.$el.find('.char-count').addClass('hide');
      }
    },

    onChangeInput: function (event) {
      var $input = $(event.currentTarget);

      // NOTE: change silently to prevent "widgets" to display unsaved changes
      // Ex: the user first/last name in the sidebar
      this.model.set(this.name, $input.val(), {silent: true});

      this.updateMaxLength($input.val().length);
    },

    // Update the character counter with the remaining characters available
    updateMaxLength: function (length) {
      if (this.maxCharLength) {
        var charsLeft = this.maxCharLength - length;
        this.$el.find('.char-count').html(charsLeft);
      }
    },

    // Called before template is rendered, serialize returns an object that gets used as data for template string
    serialize: function() {
      var length = this.maxCharLength;
      var value = this.options.value || '';

      // Fill in default value if this column has a default value.
      if (!value && this.options.model.isNew() && this.options.schema.has('default_value')) {
          value = this.options.schema.get('default_value');
      }

      return {
        size: this.options.settings.get('size'),
        value: value,
        name: this.options.name,
        length: length,
        maxLength: length,
        characters: length - value.toString().length,
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder') : ''
      };
    },
    // Validate String  Checks the passed in value against validation_string
    // @param e : keypress event object
    validateString: function(e) {
      var validationMessage = this.options.settings.get('validation_message') || __t('confirm_invalid_value');
      var chars;
      switch(this.options.settings.get('validation_type')) {
        case ('bl') :
          chars = this.options.settings.get('validation_string').split('');
          return chars.indexOf(String.fromCharCode(e.which)) === -1;
        case ('wl') :
          chars = this.options.settings.get('validation_string').split('');
          return chars.indexOf(String.fromCharCode(e.which)) !== -1;
      }

      return true;
    },

    initialize: function() {
      this.maxCharLength = this.options.schema.get('length');
    }
  });
});
