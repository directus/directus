define(['app', 'core/UIComponent', './interface'], function (app, UIComponent, UIView) {
  'use strict';

  return UIComponent.extend({
    id: 'sort',
    dataTypes: ['INT', 'BIGINT'],
    Input: UIView
  });
});
