define([
  "app",
  "backbone",
  "core/baseHeaderView"
],
function(app, Backbone, BaseHeaderView) {

  return Backbone.Layout.extend({

    template: 'basePage',

    chooseView: function(viewSet, viewName) {
      return _.isUndefined(viewName) ? viewSet : viewSet[viewName];
    },
    
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
    
    initToolbar: function() {
      this.headerOptions.leftToolbar = _.isEqual(this.headerOptions.leftToolbar, this.leftToolbar()) ? this.headerOptions.leftToolbar : this.leftToolbar();
      this.headerOptions.rightToolbar = _.isEqual(this.headerOptions.rightToolbar, this.rightToolbar()) ? this.headerOptions.rightToolbar : this.rightToolbar();
      this.headerOptions.leftSecondaryToolbar = _.isEqual(this.headerOptions.leftSecondaryToolbar, this.leftSecondaryToolbar()) ? this.headerOptions.leftSecondaryToolbar : this.leftSecondaryToolbar();
      this.headerOptions.rightSecondaryToolbar = _.isEqual(this.headerOptions.rightSecondaryToolbar, this.rightSecondaryToolbar()) ? this.headerOptions.rightSecondaryToolbar : this.rightSecondaryToolbar();
      
      this.headerView = new BaseHeaderView({headerOptions: this.headerOptions});
      this.setView('#fixedHeader', this.headerView);
    },
    
    reRender: function() {
      this.initToolbar();
    },
    
    beforeRender: function() {
      this.initToolbar();
         
      /*
this.headerOptions.rightToolbar = this.rightToolbar();
      this.headerOptions.leftSecondaryToolbar = this.leftSecondaryToolbar();
      this.headerOptions.rightSecondaryToolbar = this.rightSecondaryToolbar();
*/

      
    }
  });
});