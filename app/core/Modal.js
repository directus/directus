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
    //   this.events = _.extend(this._events, this.events);
      Backbone.Layout.prototype.constructor.apply(this, arguments);
    //
    //   var self = this;
    //   this.on('afterRender', function() {
    //     var $el = self.$el;
    //
    //     $el.parent().fadeIn(200, function() {
    //       $el.addClass('active');
    //     });
    //   });
    }
  });
});
