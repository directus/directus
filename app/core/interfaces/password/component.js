/* global $ */
define(['core/interfaces/password/interface', 'underscore', 'core/UIComponent', 'core/t'], function (Input, _, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({

    id: 'password',
    dataTypes: ['VARCHAR', 'CHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],

    skipSerializationIfNull: true,

    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'require_confirmation',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Render a second textinput to confirm the password',
        default_value: true
      },
      {
        id: 'salt_field',
        ui: 'text_input',
        type: 'String',
        comment: 'The column which hold the value to use as salt',
        default_value: 'salt'
      }
    ],

    Input: Input,

    validate: function (value, interfaceOptions) {
      var $el = $('input[name="' + interfaceOptions.schema.id + '"]').parent();
      var password = $el.find('input.password-primary').val();
      var confirm = $el.find('input.password-confirm').val();

      if (interfaceOptions.model.isMine() && !password && interfaceOptions.schema.get('required')) {
        return __t('you_must_specify_a_password');
      }

      if (password && password !== confirm) {
        return __t('password_must_match');
      }
    },

    list: function (options) {
      return (options.value) ? '••••••••••' : '';
    }
  });
});
