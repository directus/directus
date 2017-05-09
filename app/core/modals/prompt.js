define(['core/Modal', 'underscore'], function(Modal, _) {

  'use strict';

  return Modal.extend({

    template: 'modal/prompt',

    attributes: {
      'id': 'modal',
      'class': 'modal confirm'
    },

    serialize: function() {
      var message = (this.options.text) ? this.options.text : '';
      var data = {message: message};

      switch(this.options.type) {
        case 'prompt':
          data.isPrompt = true;
          data.showInput = true;
          break;
        case 'yesno':
          data.isYesNoConfirm = true;
          break;
        case 'alert':
          data.isAlert = true;
          break;
        default:
          data.isPrompt = true;
          break;
      }

      return data;
    },

    events: {
      'click #cancel': function() {
        this.closePrompt();
      },

      'click #save': function() {
        this.save();
      },

      'click #noBtn': function() {
        this.closePrompt();
        this.options.callback('no');
      },

      'click #yesBtn': function() {
        this.closePrompt();
        this.options.callback('yes');
      },

      'click #okBtn': function() {
        this.closePrompt();
      }
    },

    closePrompt: function() {
      if (_.isFunction(this.options.cancelCallback)) {
        this.options.cancelCallback();
      }

      if (this.container) {
        this.container.close();
      } else {
        Modal.prototype.close.apply(this, arguments);
      }
    },

    save: function() {
      var val = '';

      if (this.$el.find('input')) {
        val = this.$el.find('input').val();
      }

      if (_.isFunction(this.options.callback)) {
        this.options.callback(val);
      }

      this.closePrompt();
    },

    afterRender: function(view) {
      this.$el.find('input[type="text"]').focus();
    },

    initialize: function (options) {
      this.options = options;
    }
  });
});
