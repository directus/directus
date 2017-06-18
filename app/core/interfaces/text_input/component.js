define([
  './interface',
  'core/UIComponent',
  'core/t'
], function(Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'text_input',
    dataTypes: ['VARCHAR', 'CHAR', 'DATE', 'TIME', 'ENUM'],
    variables: [
      // Disables editing of the field while still letting users see the value (true = readonly)
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'toggle'},
      // Adjusts the max width of the input (Small, Medium, Large)
      {id: 'size', type: 'String', default_value: 'large', ui: 'select', options: {options: {'large': __t('size_large'), 'medium': __t('size_medium'), 'small': __t('size_small')}}},
      // Grayed out default placeholder text in the input when it's empty
      {id: 'placeholder_text', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      // Chooses the type of validation used on this field
      // * Character Blacklist: Choose the specific characters **not** allowed in the input
      // * Character Whitelist: Choose the specific characters allowed in the input
      // * RegEx: Create a regular expression to validate the value. Useful for emails, phone number formatting, or almost anything
      {id: 'validation_type', type: 'String', ui: 'select', options: {options: {'bl': __t('character_blacklist'), 'wl': __t('character_whitelist'), 'rgx': __t('regex')} }, default_value: 'rgx'},
      // Holds the CSV list of Whitelist/Blacklist characters or the RegEx value (based on the above option)
      {id: 'validation_string', type: 'String', default_value: '', ui: 'text_input', char_length: 200, comment: __t('text_input_validation_string_comment')},
      // A message that is shown to the user if the validation fails
      {id: 'validation_message', type: 'String', default_value: '', ui: 'text_input', char_length: 200}
    ],
    Input: Input,
    validate: function(value, options) {
      var validationMessage = options.settings.get('validation_message') || __t('confirm_invalid_value');

      if (_.isEmpty(value)) {
        if (options.schema.get('required') === true) {
          return __t('this_field_is_required');
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
});
