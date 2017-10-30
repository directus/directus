define(['core/UIView'], function (UIView) {
  'use strict';

  return UIView.extend({
    template: 'text_input/input',

    events: {
      'focus input': 'toggleHideClass',
      'blur input': 'toggleHideClass',
      'input input': 'saveAndUpdateCharCount',
      'keypress input': 'validateString'
    },

    /**
     * Serialize the data that's being send to the Handlebars template
     * @return {Object} Locals for Handlebars template
     */
    serialize: function () {
      var schema = this.options.schema;
      var settings = this.options.settings;

      var name = this.options.name;
      var length = schema.get('length');
      var value = this.options.value || schema.get('default_value') || '';

      var autoSize = settings.get('size') === 'auto';
      var charsLeft = length - value.toString().length;
      var placeholder = settings.get('placeholder') || '';
      var readOnly = settings.get('read_only') || !this.options.canWrite;
      var showCharacterCount = this.options.schema.get('length');
      var size = settings.get('size');

      return {
        autoSize: autoSize,
        charsLeft: charsLeft,
        maxLength: length,
        name: name,
        placeholder: placeholder,
        readOnly: readOnly,
        showCharacterCount: showCharacterCount,
        size: size,
        value: value
      };
    },

    /**
     * Toggle the class 'hide' on the .char-count element
     */
    toggleHideClass: function () {
      this.$el.find('.char-count').toggleClass('hide');
    },

    /**
     * Save value to model and update character count div
     * @param  {Object} event The input's input event
     */
    saveAndUpdateCharCount: function (event) {
      var maxLength = this.options.schema.get('length');
      var trim = this.options.settings.get('trim');

      var $input = this.$(event.currentTarget);

      var value = $input.val();

      if (trim) {
        value = value.trim();
      }

      // Set silently to prevent "widgets" to display unsaved changes
      //   Ex: the user first/last name in the sidebar
      this.model.set(this.name, value, {silent: true});

      if (maxLength) {
        var charsLeft = maxLength - $input.val().length;
        this.$el.find('.char-count').html(charsLeft);
      }
    },

    /**
     * Checks the passed in value against the validation_string
     * @param  {Object} event The input's keypress event
     * @return {Boolean} Validates or not
     */
    validateString: function (event) {
      var chars;
      var validationType = this.options.settings.get('validation_type');
      var validationString = this.options.settings.get('validation_string');

      switch (validationType) {
        case ('bl') :
          chars = validationString.split('');
          return chars.indexOf(String.fromCharCode(event.which)) === -1;
        case ('wl') :
          chars = validationString.split('');
          return chars.indexOf(String.fromCharCode(event.which)) !== -1;
        default:
          break;
      }

      return true;
    }
  });
});
