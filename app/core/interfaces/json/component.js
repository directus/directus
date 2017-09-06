/* global _ */
define([
  'underscore',
  './interface',
  'core/UIComponent',
  'core/t'
], function (_, Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'json',
    dataTypes: ['TEXT', 'VARCHAR', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    Input: Input,
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'indent',
        ui: 'text_input',
        type: 'String',
        comment: 'What character(s) to use as indentation',
        default_value: '\t'
      },
      {
        id: 'rows',
        ui: 'numeric',
        type: 'Number',
        comment: 'Height of the field in rows',
        default_value: 12,
        char_length: 3
      },
      {
        id: 'placeholder',
        ui: 'text_input',
        type: 'String',
        comment: 'Enter Placeholder Text',
        default_value: ''
      }
    ],
    validate: function (value, interfaceOptions) {
      if (interfaceOptions.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }

      try {
        JSON.parse(value);
      } catch (err) {
        return err;
      }
    },
    list: function (interfaceOptions) {
      return _.isString(interfaceOptions.value)
        ? interfaceOptions.value.replace(/<(?:.|\n)*?>/gm, '').substr(0, 100)
        : '<span class="silver">--</span>';
    }
  });
});
