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
      $('body').removeClass(app.dom.RIGHT_PANE_OPEN);
      this.trigger('close');
    },

    open: function() {
      this.state.open = true;
      $('body').addClass(app.dom.RIGHT_PANE_OPEN);
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
