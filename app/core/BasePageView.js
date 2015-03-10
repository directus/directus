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

    headerOptions: {

    },

    initToolbar: function() {
      this.headerOptions.leftToolbar = this.leftToolbar();
      this.headerOptions.rightToolbar = this.rightToolbar();
      this.headerOptions.leftSecondaryToolbar = this.leftSecondaryToolbar();
      this.headerOptions.rightSecondaryToolbar = this.rightSecondaryToolbar();

      this.headerView = new BaseHeaderView({headerOptions: this.headerOptions});
      this.setView('#fixedHeader', this.headerView);
    },

    reRender: function() {
      this.initToolbar();
      this.headerView.render();
    },

    beforeRender: function() {
      this.initToolbar();
    },
    fetchHolding: [],
    //Only fetch if we are not waiting on any widgets to get preference data
    tryFetch: function() {
      if(this.fetchHolding.length === 0) {
        var options = this.collection.options ? this.collection.options : {};
        this.collection.fetch(options);
      }
    },

    addHolding: function(cid) {
      this.fetchHolding.push(cid);
    },

    //Remove a cid from holding and try fetch
    removeHolding: function(cid) {
      this.fetchHolding.splice(this.fetchHolding.indexOf(cid), 1);
      this.tryFetch();
    }

  });
});