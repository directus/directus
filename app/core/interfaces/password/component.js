define(['core/interfaces/password/interface', 'underscore', 'core/UIComponent', 'core/t'], function (Input, _, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({

    id: 'password',

    dataTypes: ['VARCHAR'],

    skipSerializationIfNull: true,

    variables: [
      // Toggles the second input ("Confirm Password"). On by default.
      {id: 'require_confirmation', default_value: true, type: 'Boolean', ui: 'checkbox'},
      // The name of the column to be used as a salt in the password hash
      {id: 'salt_field', type: 'String', default_value: 'salt', ui: 'textinput'}
    ],

    Input: Input,

    validate: function (value, options) {
      var $el = $('input[name="' + options.schema.id + '"]').parent();
      var password = $el.find('input.password-primary').val();
      var confirm = $el.find('input.password-confirm').val();

      if (options.model.isMine() && !password && options.schema.get('required')) {
        return __t('you_must_specify_a_password');
      }

      if (password && password !== confirm) {
        return __t('password_must_match');
      }
    },

    list: function (options) {
      return (options.value) ? options.value.toString().substr(0, 20).replace(/./g, '•') : '';
    }
  });
});
