define(['app', 'core/UIComponent', 'core/UIView'], function (app, UIComponent, UIView) {
  'use strict';

  return UIComponent.extend({
    id: 'date_modified',
    dataTypes: ['DATETIME', 'DATE', 'TIMESTAMP'],
    Input: UIView
  });
});
