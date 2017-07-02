define([
  'app',
  'core/UIComponent',
  './user_interface'
], function (app, UIComponent, Input) {

  'use strict';

  return UIComponent.extend({
    id: 'user_modified',
    dataTypes: ['INT', 'BIGINT'],
    Input: Input
  });
});
