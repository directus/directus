define(function(require, exports, module) {

  'use strict';

  var _ = require('underscore');
  var jQuery = require('jquery');
  var defaultListViews = [
    require('core/listings/table'),
    require('core/listings/tiles'),
    require('core/listings/map'),
    require('core/listings/calendar')
  ];

  /**
   * @private
   * Holds all UI's that are registered
   */
  var views = {};

  // Attach all methods to the UIManager prototype.
  module.exports = {

    setup: function () {
      this.register(defaultListViews);
    },

    register: function (listViews) {
      _.each(listViews, function(view) {
        views[view.id] = view;
      }, this);
    },

    // Loads an array of paths to UI's and registers them.
    // Returns a jQuery Deferred's Promise object
    load: function (paths) {
      var self = this;
      var dfd = new jQuery.Deferred();

      require(paths, function () {
        self.register(_.values(arguments));
        dfd.resolve();
      });

      return dfd;
    },

    get: function (viewId) {
      return views[viewId];
    },

    getView: function (viewId, options) {
      var View = views['table'].View;
      var defaultOptions = {id: 'table'};

      if (viewId != null && views.hasOwnProperty(viewId)) {
        View = views[viewId].View;
        defaultOptions.id = viewId;
      }

      options = _.extend(defaultOptions, (options || {}));

      return new View(options);
    },

    getInstance: function (options) {
      return this.getView('table', options)
    },

    getViews: function() {
      return views;
    }
  };

});
