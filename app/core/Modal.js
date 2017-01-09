define(['app', 'backbone', 'underscore'], function(app, Backbone, _) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'modal/modal',

    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    setContainer: function(container) {
      this.container = container;
    },

    close: function() {
      var self = this;
      self.remove();
    },

    constructor: function() {
      this.on('afterRender', _.bind(function() {
        this.$el.addClass('active');
      }, this));

      Backbone.Layout.prototype.constructor.apply(this, arguments);
    }
  });
});
