define([
  'core/UIComponent',
  '../../user/interface'
], function (UIComponent, Input) {

  'use strict';

  return UIComponent.extend({
    id: 'user_created',
    dataTypes: ['INT', 'BIGINT'],
    Input: Input
  });
});
