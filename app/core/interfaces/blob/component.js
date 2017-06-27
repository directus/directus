define(['core/interfaces/blob/interface', 'core/UIComponent'], function (Input, UIComponent) {
  'use strict';

  return UIComponent.extend({
    id: 'blob',
    dataTypes: ['BLOB', 'MEDIUMBLOB'],
    Input: Input,
    list: function () {
      return 'BLOB';
    }
  });
});
