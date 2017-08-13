define([
  'app',
  'backbone',
  'underscore'
], function(app, Backbone, _) {

  return Backbone.Layout.extend({

    state: {},

    dom: {
      SMALL: 'right-sidebar-open',
      WIDE: 'right-sidebar-open-wide'
    },

    getOpenClassName: function () {
      return this.state.wide ? this.dom.WIDE : this.dom.SMALL;
    },

    getAllOpenClassName: function () {
      return [
        this.dom.SMALL,
        this.dom.WIDE
      ].join(' ');
    },

    close: function () {
      this.state.open = false;
      $('body').removeClass(this.getOpenClassName());
      this.trigger('close');
    },

    open: function () {
      this.state.open = true;
      $('body').addClass(this.getOpenClassName());
      this.trigger('open');
    },

    isOpen: function () {
      return this.state.open;
    },

    toggle: function () {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    },

    shouldOpen: function () {
      return false;
    },

    canBeOpen: function () {
      return !this.model.isNew();
    },

    constructor: function (options) {
      this.baseView = options.baseView;
      this.state.open = false;
      this.state.wide = options.wide === true;

      Backbone.Layout.prototype.constructor.apply(this, arguments);
    }
  });
});
