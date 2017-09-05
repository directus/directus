/* global _ */
define([
  'underscore',
  './interface',
  'core/UIComponent',
  'core/t'
], function (_, Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'encrypted',
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
            core: 'Default',
            bcrypt: 'bcrypt',
            md5: 'md5',
            sha1: 'SHA-1',
            sha224: 'SHA-224',
            sha256: 'SHA-256',
            sha384: 'SHA-384',
            sha512: 'SHA-512'
          }
        }
      }
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      if (_.isEmpty(value)) {
        if (interfaceOptions.schema.get('required') === true) {
          return __t('this_field_is_required');
        }
      }
    },
    list: function (interfaceOptions) {
      return (interfaceOptions.value)
        ? interfaceOptions.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100)
        : '';
    }
  });
});
