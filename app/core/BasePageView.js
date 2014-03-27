define([
  "app",
  "backbone",
  "core/header/baseHeaderView"
],
function(app, Backbone, BaseHeaderView) {

  return Backbone.Layout.extend({

    template: 'basePage',

    headerOptions: {
      route: {
        title: "Directus"
      }
    },

    beforeRender: function() {
      this.setView('#fixedHeader', new BaseHeaderView({headerOptions: this.headerOptions}));
    }
  });
});