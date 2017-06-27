/* global $ */
define([
  'core/UIComponent',
  './interface'
], function (UIComponent, Input) {
  'use strict';

  return UIComponent.extend({
    id: 'random',
    dataTypes: ['VARCHAR', 'CHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    variables: [
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
      }, {
        id: 'auto_generate',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Automatically generate a random string',
        default_value: false
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
    validate: function (value, options) {
      var $el = $('input[name="' + options.schema.id + '"]').parent();
      var randomString = $el.find('input.password-primary').val();

      if (!randomString && options.schema.get('required')) {
        return 'This field is required [' + options.schema.id + '].';
      }
    },
    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    }
  });
});
