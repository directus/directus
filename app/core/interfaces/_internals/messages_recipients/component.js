define(['core/interfaces/_internals/messages_recipients/interface', 'core/UIComponent'], function (Input, UIComponent) {
  'use strict';

  return UIComponent.extend({
    id: 'directus_messages_recipients',
    Input: Input,
    list: function () {
      return '';
    }
  });
});
