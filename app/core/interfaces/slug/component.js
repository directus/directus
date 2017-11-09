/* global _ */
define([
  'underscore',
  './interface',
  'core/UIComponent',
  'core/t'
], function (_, Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'slug',
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
        id: 'size',
        ui: 'dropdown',
        type: 'String',
        comment: 'What width to use for the input',
        default_value: 'large',
        options: {
          options: {
            large: __t('size_large'),
            medium: __t('size_medium'),
            small: __t('size_small')
          }
        }
      },
      {
        id: 'mirrored_field',
        ui: 'text_input',
        type: 'String',
        comment: 'Column name of the field the slug will pull it\'s value from',
        default_value: '',
        char_length: 200
      },
      {
        id: 'force_lowercase',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force the slug to be in all lowercase',
        default_value: true
      },
      {
        id: 'only_on_creation',
        ui: 'toggle',
        type: 'Boolean',
        comment: __t('slug_only_on_creation_comment'),
        default_value: false
      }
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      if (interfaceOptions.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (interfaceOptions) {
      return (interfaceOptions.value) ?
        interfaceOptions.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) :
        '';
    }
  });
});
