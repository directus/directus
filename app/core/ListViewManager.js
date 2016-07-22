define(function(require, exports, module) {

  "use strict";

  var TableView = require('core/table/table.view');
  var jQuery = require('jquery');

  /**
   * @private
   * Holds all UI's that are registered
   */
  var views = {};

  // Attach all methods to the UIManager prototype.
  module.exports = {

    register: function(listViews) {
      _.each(listViews, function(view) {
        views[view.id] = view.View;
      },this);
    },

    // Loads an array of paths to UI's and registers them.
    // Returns a jQuery Deferred's Promise object
    load: function(paths) {
      var self = this;
      var dfd = new jQuery.Deferred();

      require(paths, function() {
        self.register(_.values(arguments));
        dfd.resolve();
      });

      return dfd;
    },

    getInstance: function(options) {
      var viewId = options.collection.table.get('list_view');
      var View;

      if (viewId != null && views.hasOwnProperty(viewId)) {
        View = views[viewId];
      } else {
        View = TableView;
      }

      return new View(options);
    }

  };

});
