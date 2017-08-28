/* global $ */
define(['core/UIView'], function (UIView) {
  'use strict';

  return UIView.extend({
    template: 'text_input/input',

    // Event Declarations
    events: {
      // Show character counter when input gains focus
      'focus input': function () {
        this.$el.find('.char-count').removeClass('hide');
      },
      // Update character counter when input changes
      'input input': 'onChangeInput',
      // Validate keypress against validation_string
      'keypress input': 'validateString',
      // Hide character counter when input loses focus
      'blur input': function () {
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
    serialize: function () {
      var length = this.maxCharLength;
      var value = this.options.value || this.options.schema.get('default_value') || '';

      return {
        size: this.options.settings.get('size'),
        value: value,
        name: this.options.name,
        length: length,
        maxLength: length,
        characters: length - value.toString().length,
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        autoSize: this.options.settings.get('size') === 'auto',
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder') : ''
      };
    },
    // Validate String  Checks the passed in value against validation_string
    // @param e : keypress event object
    validateString: function (e) {
      var chars;

      switch (this.options.settings.get('validation_type')) {
        case ('bl') :
          chars = this.options.settings.get('validation_string').split('');
          return chars.indexOf(String.fromCharCode(e.which)) === -1;
        case ('wl') :
          chars = this.options.settings.get('validation_string').split('');
          return chars.indexOf(String.fromCharCode(e.which)) !== -1;
        default:
          break;
      }

      return true;
    },

    initialize: function () {
      this.maxCharLength = this.options.schema.get('length');
    }
  });
});
