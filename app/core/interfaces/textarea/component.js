/* global _ */
define([
  'underscore',
  'core/interfaces/textarea/interface',
  'core/UIComponent',
  'core/t'
], function (_, Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'textarea',
    dataTypes: ['TEXT', 'CHAR', 'VARCHAR', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      // The number of text rows available for the input before scrolling
      {
        id: 'rows',
        ui: 'numeric',
        type: 'Number',
        comment: 'The number of text rows available for the input before scrolling',
        default_value: 12,
        char_length: 3
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
      if (interfaceOptions.schema.isRequired() && _.isEmpty(value)) {
        // TODO: fix this line, it is too repetitive
        // over all the UIs
        return __t('this_field_is_required');
      }
    },
    list: function (interfaceOptions) {
      return _.isString(interfaceOptions.value)
        ? interfaceOptions.value.replace(/<(?:.|\n)*?>/gm, '').substr(0, 100)
        : '<span class="silver">--</span>';
    }
  });
});
