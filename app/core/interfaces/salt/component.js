define(['core/interfaces/salt/interface', 'core/UIComponent'], function (Input, UIComponent) {
  'use strict';

  var Component = UIComponent.extend({
    id: 'salt',
    dataTypes: ['VARCHAR'],
    skipSerializationIfNull: true,
    Input: Input,
    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    }
  });

  return Component;
});
