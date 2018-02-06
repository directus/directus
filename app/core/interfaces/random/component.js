/* global $ */
define([
  'core/UIComponent',
  './interface'
], function (UIComponent, Input) {
  'use strict';

  return UIComponent.extend({
    id: 'random',
    dataTypes: ['VARCHAR', 'CHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'string_length',
        ui: 'numeric',
        type: 'Number',
        comment: 'The length of the value',
        default_value: 32,
        char_length: 200
      },
      {
        id: 'allow_any_value',
        type: 'Boolean',
        ui: 'toggle',
        comment: 'Allow the user to override the random string',
        default_value: true
      },
      {
        id: 'auto_generate',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Automatically generate a random string',
        default_value: false
      },
      {
        id: 'type_of_value',
        ui: 'dropdown',
        type: 'String',
        comment: 'Type of random string to generate',
        default_value: 'alphanumeric',
        options: {
          options: {
            alphanumeric: 'Letters and numbers',
            numeric: 'Numbers only',
            loweralpha: 'Lowercase letters only',
            upperalpha: 'Uppercase letters only',
            loweralphanumeric: 'Lowercase letters and numbers',
            upperalphanumeric: 'Uppercase letters and numbers',
          }
        }
      },
      {
        id: 'placeholder',
        ui: 'text_input',
        type: 'String',
        comment: 'Enter Placeholder Text',
        default_value: '',
        char_length: 200
      }
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      var $el = $('input[name="' + interfaceOptions.schema.id + '"]').parent();
      var randomString = $el.find('input.password-primary').val();

      if (!randomString && interfaceOptions.schema.get('required')) {
        return 'This field is required [' + interfaceOptions.schema.id + '].';
      }
    },
    list: function (interfaceOptions) {
      return (interfaceOptions.value)
        ? interfaceOptions.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100)
        : '';
    }
  });
});
