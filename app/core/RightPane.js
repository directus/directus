define([
  'app',
  'backbone',
  'underscore'
], function(app, Backbone, _) {

  return Backbone.Layout.extend({

    state: {
      open: false
    },

    close: function() {
      this.state.open = false;
      $('body').removeClass('right-sidebar-open');
      this.trigger('close');
    },

    open: function() {
      this.state.open = true;
      $('body').addClass('right-sidebar-open');
      this.trigger('open');
    },

    isOpen: function() {
      return this.state.open;
    },

    toggle: function() {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    },

    constructor: function(options) {
      this.baseView = options.baseView;

      Backbone.Layout.prototype.constructor.apply(this, arguments);
    }
  });
});
