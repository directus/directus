define(['core/UIComponent', './interface'], function (UIComponent, Input) {
  return UIComponent.extend({
    id: 'exampletextlimit',
    dataTypes: ['TEXT'],
    Input: Input
  });
});
