define(['app', 'core/UIComponent', 'core/UIView'], function (app, UIComponent, UIView) {
  'use strict';

  return UIComponent.extend({
    id: 'user_created',
    dataTypes: ['INT', 'BIGINT'],
    Input: UIView
  });
});
