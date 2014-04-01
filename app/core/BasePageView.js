define([
  "app",
  "backbone",
  "core/baseHeaderView"
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

    leftSecondaryToolbar: function() {
      return [];
    },
    
    rightSecondaryToolbar: function() {
      return [];
    },
    
    beforeRender: function() {
      this.headerOptions.leftToolbar = this.leftToolbar();
      this.headerOptions.rightToolbar = this.rightToolbar();
      this.headerOptions.leftSecondaryToolbar = this.leftSecondaryToolbar();
      this.headerOptions.rightSecondaryToolbar = this.rightSecondaryToolbar();

      this.headerView = new BaseHeaderView({headerOptions: this.headerOptions});
      this.setView('#fixedHeader', this.headerView);
    }
  });
});