define([
  "app",
  "backbone",
  "core/widgets/baseHeaderView"
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
      this.headerOptions.leftWidgets = this.leftToolbar();
      this.headerOptions.rightWidgets = this.rightToolbar();
      this.headerOptions.secondaryWidgets = this.secondaryRow();

      this.headerView = new BaseHeaderView({headerOptions: this.headerOptions});
      this.setView('#fixedHeader', this.headerView);
    }
  });
});