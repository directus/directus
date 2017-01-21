define([
  'app',
  'backbone',
  'underscore',
  'core/baseHeaderView',
  'core/rightSidebarView'
],
function(app, Backbone, _, BaseHeaderView, RightSidebarView) {

  return Backbone.Layout.extend({

    template: 'basePage',

    // el: '#content',

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

    state: {

    },

    initToolbar: function() {
      var mainView = app.router.v.main;

      this.headerOptions.leftToolbar = this.leftToolbar();
      this.headerOptions.rightToolbar = this.rightToolbar();
      this.headerOptions.leftSecondaryToolbar = this.leftSecondaryToolbar();
      this.headerOptions.rightSecondaryToolbar = this.rightSecondaryToolbar();
      this.headerView = mainView.getView('#header');
      this.headerView.setPage(this);

      mainView.setView('#header', this.headerView);

      if (_.result(this, 'rightPane')) {
        this.rightSidebarView = new RightSidebarView(_.result(this, 'rightPaneOptions'));
        this.insertView(this.rightSidebarView);
      }

      if (this.state.rightPaneOpen === true) {
        this.on('afterRender', this.loadRightPane);
      }
    },

    toggleRightPane: function() {
      var pane = this.loadRightPane();

      if (pane) {
        pane.toggle();
      }
    },

    loadRightPane: function() {
      var view = _.result(this, 'rightPane');

      if (!view) {
        return;
      }

      if (!this.rightPaneView) {
        var baseView = this.baseView || this;
        this.rightPaneView = new view({
          baseView: baseView,
          collection: baseView.collection,
          model: baseView.model
        });
      }

      this.listenTo(this.rightPaneView, 'close', function() {
        this.state.rightPaneOpen = false;
      });

      this.listenTo(this.rightPaneView, 'open', function() {
        this.state.rightPaneOpen = true;
      });

      if (!this.rightPaneView.hasRendered) {
        this.setView('#rightSidebar', this.rightPaneView).render();
      }

      return this.rightPaneView;
    },

    reRender: function() {
      this.initToolbar();
      this.headerView.render();
    },

    beforeRender: function() {
      this.rightPaneView = null;
      this.initToolbar();
      // render the header manually
      // this view is part of the main view and is not a child of this view
      this.headerView.render();
    },

    fetchHolding: [],

    // Only fetch if we are not waiting on any widgets to get preference data
    tryFetch: function() {
      if (this.fetchHolding.length === 0) {
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
