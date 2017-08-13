define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'core/baseHeaderView',
  'core/rightSidebarView'
], function (app, Backbone, _, Handlebars, BaseHeaderView, RightSidebarView) {

  'use strict';

  return Backbone.Layout.extend({

    template: Handlebars.compile('<section class="main-container" id="page-content"></section>'),

    attributes: {
      class: 'page-container'
    },

    // el: '#content',

    chooseView: function (viewSet, viewName) {
      return _.isUndefined(viewName) ? viewSet : viewSet[viewName];
    },

    leftToolbar: function () {
      return [];
    },

    rightToolbar: function () {
      return [];
    },

    leftSecondaryToolbar: function () {
      return [];
    },

    rightSecondaryToolbar: function () {
      return [];
    },

    headerOptions: {

    },

    state: {

    },

    initToolbar: function () {
      var mainView = app.router.v.main;
      this.headerOptions.rightToolbar = this.rightToolbar();
      this.headerOptions.leftToolbar = this.leftToolbar();
      this.headerOptions.leftSecondaryToolbar = this.leftSecondaryToolbar();
      this.headerOptions.rightSecondaryToolbar = this.rightSecondaryToolbar();
      this.headerView = mainView.getView('#header');
      this.headerView.setPage(this);
    },

    initRightSidebar: function () {
      if (_.result(this, 'rightPane')) {
        // hotfix: adding this twice
        if (this.rightSidebarView) {
          this.rightSidebarView.remove();
          //this.removeView('#rightSidebar');
        }

        this.rightSidebarView = new RightSidebarView(_.result(this, 'rightPaneOptions'));
        this.insertView(this.rightSidebarView);
      }

      if (this.isRightPaneOpen()) {
        this.on('afterRender', this.loadRightPane, this);
      } else if (this.shouldRightPaneOpen()) {
        this.on('afterRender', function () {
          this.openRightPane();
        }, this);
      } else {
        this._ensurePaneIsClosed();
      }
    },

    shouldRightPaneOpen: function () {
      var pane = this.getRightPane();

      return $(window).width() >= 1200 && pane && pane.shouldOpen();
    },

    isRightPaneOpen: function () {
      // @TODO: set all this stage in the app level
      var hasOpenClass = false;
      var pane = this.getRightPane();

      if (pane) {
        hasOpenClass = $('body').hasClass(pane.getOpenClassName());
      }

      return hasOpenClass || this.state.rightPaneOpen === true;
    },

    openRightPane: function (force) {
      var pane = this.loadRightPane();

      if (force || (pane && pane.canBeOpen())) {
        pane.open();
      }
    },

    _ensurePaneIsClosed: function () {
      var pane = this.getRightPane();

      if (pane) {
        $('body').removeClass(pane.getAllOpenClassName());
      }

      this.state.rightPaneOpen = false;
    },

    closeRightPane: function () {
      var pane = this.loadRightPane();

      if (pane) {
        pane.close();

        setTimeout(_.bind(function () {
          this.trigger('rightPane:toggle', this);
        }, this), 200);
      }

      this._ensurePaneIsClosed();
    },

    toggleRightPane: function () {
      var pane = this.loadRightPane();

      if (pane) {
        pane.toggle();
        setTimeout(_.bind(function () {
          this.trigger('rightPane:toggle', this);
        }, this), 200);
      }
    },

    _ensureRightPane: function () {
      if (this.rightPaneView) {
        return;
      }

      var view = _.result(this, 'rightPane');

      if (!view) {
        return;
      }

      if (!this.rightPaneView) {
        var baseView = this.baseView || this;
        this.rightPaneView = new view({
          baseView: baseView,
          collection: baseView.collection,
          model: baseView.model,
          listView: this.state ? this.state.viewId : null
        });

        this.trigger('rightPane:load');
      }
    },

    getRightPane: function () {
      this._ensureRightPane();

      return this.rightPaneView;
    },

    loadRightPane: function () {
      if (!this.getRightPane()) {
        return;
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

    reRender: function () {
      this.initToolbar();
      this.headerView.render();
    },

    beforeRender: function () {
      this.rightPaneView = null;
      this.initToolbar();
      this.initRightSidebar();

      // render the header manually
      // this view is part of the main view and is not a child of this view
      this.headerView.render();

      // hotfix adding dedicated class for settings
      var options = this.viewOptions || {};
      var attributes = {};
      attributes['class'] = _.result(options, 'className') || 'page';
      $('#content').attr(attributes);
    },

    getSpacing: function () {
      return _.result(this.table, 'getSpacing');
    },

    fetchHolding: [],

    // Only fetch if we are not waiting on any widgets to get preference data
    tryFetch: function (options) {
      if (this.fetchHolding.length === 0) {
        this.collection.fetch(_.defaults(this.collection.options || {}, options));
      }
    },

    addHolding: function (cid) {
      this.fetchHolding.push(cid);
    },

    //Remove a cid from holding and try fetch
    removeHolding: function (cid) {
      this.fetchHolding.splice(this.fetchHolding.indexOf(cid), 1);
      this.tryFetch();
    },

    cleanup: function () {
      this._ensurePaneIsClosed();
      // NOTE: a way to remove the cached collection
      // when the page is changed we need to clean up the cache
      this.currentCollection = undefined;

      if (this.options.parentView) {
        this.model.stopTracking();
      }
    }
  });
});
