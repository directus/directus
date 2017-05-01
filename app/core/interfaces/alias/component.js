define(['core/UIComponent', 'core/UIView'], function (UIComponent, UIView) {
  'use strict';

  return UIComponent.extend({
    id: 'alias',
    dataTypes: ['ALIAS', 'ONETOMANY', 'MANYTOMANY'],
    Input: UIView
  });
});
