define(['backbone', 'core/directus', 'core/BasePageView'], function (Backbone, Directus, BasePageView) {
  return {
    Router: Directus.SubRoute,
    View: Backbone.Layout.extend({
      prefix: 'customs/extensions/'
    }),
    BasePageView: BasePageView
  };
});
