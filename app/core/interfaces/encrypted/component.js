/* global _ */
define([
  './interface',
  'core/UIComponent',
  'core/t'
], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'encrypted',
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
        id: 'hide_value',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Displays dots (●) instead of the text you enter',
        default_value: false
      },
      {
        id: 'placeholder',
        ui: 'text_input',
        type: 'String',
        comment: 'Enter Placeholder Text',
        default_value: '',
        char_length: 200
      },
      {
        id: 'hashing_type',
        ui: 'dropdown',
        type: 'String',
        comment: 'What method of hashing to use',
        default_value: 'core',
        options: {
          options: {
            core: 'Default (string)',
            md5: 'MD5',
            sh1: 'SH1'
          }
        }
      }
    ],
    Input: Input,
    validate: function (value, options) {
      if (_.isEmpty(value)) {
        if (options.schema.get('required') === true) {
          return __t('this_field_is_required');
        }
      }
    },
    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    }
  });
});
