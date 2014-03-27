define([
  "app",
  "backbone",
  "core/header/baseHeaderView"
],
function(app, Backbone, BaseHeaderView) {

  return Backbone.Layout.extend({

    template: 'basePage',

    leftToolbar: function() {
      return [];
    },

    rightToolbar: function() {
      return [];
    },

    secondaryRow: function() {
      return [];
    },

    headerOptions: {
      route: {
        title: "Directus"
      }
    },

    beforeRender: function() {
      var leftWidgets = this.leftToolbar();
      var rightWidgets = this.rightToolbar();
      var secondaryRow = this.secondaryRow();

      leftWidgets = [1,2,3,4];

      leftWidgets.forEach(function(widget) {
        console.log(widget);
      });

      rightWidgets.forEach(function(widget) {

      });

      secondaryRow.forEach(function(widget) {

      });

      this.headerView = new BaseHeaderView({headerOptions: this.headerOptions});
      this.setView('#fixedHeader', this.headerView);
    }
  });
});