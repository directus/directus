define([
  'core/UIComponent',
  './interface'
], function (UIComponent, Input) {

  'use strict';

  return UIComponent.extend({
    id: 'random',
    dataTypes: ['VARCHAR'],
    variables: [
      {id: 'string_length', type: 'Number', default_value: 32, ui: 'numeric', char_length: 200},
      // Allow the user to input their own value
      {id: 'allow_any_value', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'auto_generate',  type: 'Boolean', default_value: false, ui: 'toggle'},
      // Initial Placeholder text for the UI
      {id: 'placeholder_text', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
    ],
    Input: Input,
    validate: function(value, options) {
      var $el = $('input[name="' + options.schema.id + '"]').parent();
      var data = $el.data();
      var randomString = $el.find('input.password-primary').val();

      if(!randomString && options.schema.get('required')) {
        return 'This field is required ['+options.schema.id+'].';
      }
    },
    list: function(options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    }
  });
});
