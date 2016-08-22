define(['backbone', 'core/directus', 'core/basePageView'], function(Backbone, Directus, BasePageView) {
  return {
    Router: Directus.SubRoute,
    View: Backbone.Layout.extend({
      prefix: 'customs/extensions/'
    }),
    BasePageView: BasePageView
  };
});
