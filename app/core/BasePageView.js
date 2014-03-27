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
      this.headerView = new BaseHeaderView({headerOptions: this.headerOptions});
      this.setView('#fixedHeader', this.headerView);
    }
  });
});