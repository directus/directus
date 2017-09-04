define(['app', 'core/UIComponent', './interface'], function (app, UIComponent, UIView) {
  'use strict';

  return UIComponent.extend({
    id: 'primary_key',
    dataTypes: ['INT', 'TINYINT', 'SMALL', 'BIGINT', 'CHAR', 'VARCHAR'],
    Input: UIView
  });
});
