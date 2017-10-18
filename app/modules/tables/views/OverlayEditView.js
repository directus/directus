define([
  'app',
  'backbone',
  'underscore',
  'modules/tables/views/EditView'
], function (app, Backbone, _, EditView) {

  'use strict';

  return EditView.extend({
    overlayEvents: {
      'click .saved-success': function () {
        this.save();
      },
      'click #removeOverlay': function () {
        app.router.removeOverlayPage(this);
      }
    },

    save: function() {
      console.error('Save function for OverlayEditView is not implemented');
    },

    initialize: function(options){
      EditView.prototype.initialize.call(this, options);

      if (options.onSave) {
        this.save = options.onSave;
      }

      this.events = _.extend({}, EditView.prototype.events, this.overlayEvents);

      this.headerOptions.route.isOverlay = true;
      this.headerOptions.route.breadcrumbs = [];
      this.headerOptions.basicSave = true;
    }
  });
});
