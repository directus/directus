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
      console.log(this.headerOptions);
    },

    updateHeaderOptions: function(options) {
      this.headerOptions = options;
      this.headerView.options.headerOptions = options;
      this.headerView.render();
    }
  });
});