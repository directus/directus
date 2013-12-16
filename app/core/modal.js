define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  var Modal = Backbone.Layout.extend({

    template: 'modal',

    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    serialize: function() {
      return {title: this.options.title || 'Dialog', buttonText: this.options.buttonText, showFooter: this.options.showFooter};
    },

    events: {
      'click button[name=save]': function(e) { e.preventDefault(); this.save(); },
      'click button[name=close]': 'close',
      'click button.close': 'close'
    },

    close: function() {
      this.trigger('close');
      $('body').removeClass('modal-open');
      this.$backdrop.remove();
      this.remove();
    },

    save: function() {

    },

    afterRender: function() {
      this.setView('.modal-body', this.options.view);
    },

    constructor: function (options) {

      // Add events from child
      if (this.events) {
        this.events = _.defaults(this.events, Modal.prototype.events);
      }

      Backbone.Layout.__super__.constructor.call(this, options);

      $('body').addClass('modal-open');
      this.$backdrop = $('<div class="modal-backdrop"/>').appendTo(document.body).on('click', $.proxy(this.close, this));

      if (this.options.stretch) {
        this.$el.addClass('stretch');
      } else {
        this.$el.removeClass('stretch');
      }

      this.options.buttonText = this.options.buttonText || 'Save changes';
      this.options.showFooter = (this.options.showFooter === undefined) ? true : this.options.showFooter;

      this.view = this.options.view;

    }
  });
  return Modal;
});