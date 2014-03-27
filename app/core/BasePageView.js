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

    serialize :function() {
      return this.headerOptions;
    },

    headerOptions: {
      route: {
        title: "Directus"
      }
    },

    beforeRender: function() {
      var leftToolbar = this.leftToolbar();
      var rightToolbar = this.rightToolbar();
      var secondaryToolbar = this.secondaryRow();

      var that = this;
      leftToolbar.forEach(function(widget) {
        that.insertView('#tools-left-insert', widget);
      });

      this.headerView = new BaseHeaderView({headerOptions: this.headerOptions});
      this.setView('#fixedHeader', this.headerView);
    }
  });
});