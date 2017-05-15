define(['./interface', 'core/UIComponent'], function (Input, UIComponent) {
  return UIComponent.extend({
    id: 'directus_views',
    Input: Input
  });
});
