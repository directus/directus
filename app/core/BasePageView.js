define([
  "app",
  "backbone",
  "core/header/baseHeaderView"
],
function(app, Backbone, HeaderView) {

  return Backbone.Layout.extend({

    template: 'basePage',

    headerOptions: {

    },

    beforeRender: function() {
      this.setView('#fixedHeader', new Header.HeaderView(headerOptions));
    }
  });
});