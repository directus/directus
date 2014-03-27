define([
  "app",
  "backbone",
  "core/header/baseHeaderView"
],
function(app, Backbone, BaseHeaderView) {

  return Backbone.Layout.extend({

    template: 'basePage',

    headerOptions: {

    },

    beforeRender: function() {
      console.log("Insert");
      this.setView('#fixedHeader', new BaseHeaderView(this.headerOptions));
    }
  });
});