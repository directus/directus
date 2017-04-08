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
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('placeholder_text') [any key from this UI options]
// options.name       String            Field name
/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

  var Input = UIView.extend({
    template: 'textinput/input',

    // Event Declarations
    events: {
      // Show character counter when input gains focus
      'focus input': function() {
        this.$el.find('.char-count').removeClass('hide');
      },
      // Update character counter when input changes
      'input input': 'updateMaxLength',
      // Validate keypress against validation_string
      'keypress input': 'validateString',
      // Hide character counter when input loses focus
      'blur input': function() {
        this.$el.find('.char-count').addClass('hide');
      }
    },

    // Update the character counter with the remaining characters available
    updateMaxLength: function(e) {
      if (this.maxCharLength) {
        var charsLeft = this.maxCharLength - e.target.value.length;
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
        readonly: ((this.options.settings && this.options.settings.get('readonly') === true) || !this.options.canWrite),
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder_text') : ''
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
          return $.inArray(String.fromCharCode(e.which), chars) === -1;
        case ('wl') :
          chars = this.options.settings.get('validation_string').split('');
          return $.inArray(String.fromCharCode(e.which), chars) !== -1;
      }

      return true;
    },

    initialize: function() {
      this.maxCharLength = this.options.schema.get('length');
    }
  });

  var Component = UIComponent.extend({
    id: 'textinput',
    dataTypes: ['VARCHAR', 'CHAR', 'DATE', 'TIME', 'ENUM'],
    variables: [
      // Disables editing of the field while still letting users see the value (true = readonly)
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'checkbox'},
      // Adjusts the max width of the input (Small, Medium, Large)
      {id: 'size', type: 'String', default_value: 'large', ui: 'select', options: {options: {'large': __t('size_large'), 'medium': __t('size_medium'), 'small': __t('size_small')}}},
      // Grayed out default placeholder text in the input when it's empty
      {id: 'placeholder_text', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      // Chooses the type of validation used on this field
      // * Character Blacklist: Choose the specific characters **not** allowed in the input
      // * Character Whitelist: Choose the specific characters allowed in the input
      // * RegEx: Create a regular expression to validate the value. Useful for emails, phone number formatting, or almost anything
      {id: 'validation_type', type: 'String', ui: 'select', options: {options: {'bl': __t('character_blacklist'), 'wl': __t('character_whitelist'), 'rgx': __t('regex')} }, default_value: 'rgx'},
      // Holds the CSV list of Whitelist/Blacklist characters or the RegEx value (based on the above option)
      {id: 'validation_string', type: 'String', default_value: '', ui: 'textinput', char_length: 200, comment: __t('textinput_validation_string_comment')},
      // A message that is shown to the user if the validation fails
      {id: 'validation_message', type: 'String', default_value: '', ui: 'textinput', char_length: 200}
    ],
    Input: Input,
    validate: function(value, options) {
      var validationMessage = options.settings.get('validation_message') || __t('confirm_invalid_value');

      if (_.isEmpty(value)) {
        if (options.schema.get('required') === true) {
          return validationMessage;
        }

        return;
      }

      switch(options.settings.get('validation_type')) {
        case ('wl') :
          var Regex = new RegExp('^[' + options.settings.get('validation_string') + ']+$');
          if(!value.match(Regex)) {
            return validationMessage;
          }
          break;
        case ('bl') :
          var chars = options.settings.get('validation_string').split('');
          if(chars.length > 0 && value.match(chars.join('|'))) {
            return validationMessage;
          }
          break;
        case ('rgx'):
          var regex = new RegExp(options.settings.get('validation_string'));
          if (!regex.test(value)) {
            return validationMessage;
          }
          break;
      }
    },
    list: function(options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    }
  });

  return Component;
});
