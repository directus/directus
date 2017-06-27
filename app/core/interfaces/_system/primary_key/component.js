define(['app', 'core/UIComponent', './interface'], function (app, UIComponent, UIView) {
  'use strict';

  return UIComponent.extend({
    id: 'primary_key',
    dataTypes: ['TINYINT', 'SMALL', 'INT', 'BIGINT'],
    Input: UIView
  });
});
