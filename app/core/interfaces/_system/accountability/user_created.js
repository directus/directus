define([
  'core/UIComponent',
  './user_interface'
], function (UIComponent, Input) {

  'use strict';

  return UIComponent.extend({
    id: 'user_created',
    dataTypes: ['INT', 'BIGINT'],
    Input: Input
  });
});
