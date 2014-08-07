define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";


  var Modal = {};

  Modal.Prompt = Backbone.Layout.extend({

    template: 'modal',

    attributes: {
      'id': 'modal',
      'class': 'modal'
    },

    serialize: function() {
      var message = (this.options.text) ? this.options.text : '';
      var data = {message: message};
      if(this.options.type === 'prompt') {
        data.showInput = true;
      }

      switch(this.options.type) {
        case 'prompt':
          data.isPrompt = true;
          data.showInput = true;
          break;
        case 'yesnocancel':
          data.isYesNoConfirm = true;
          break;
        default:
          data.isPrompt = true;
          break;
      }

      return data;
    },

    events: {
      'click #cancel': function() {
        this.close();
      },
      'click #save': function() {
        this.save();
      },
      'click #noBtn': function() {
        this.options.callback('no');
        this.close();
      },
      'click #yesBtn': function() {
        this.options.callback('yes');
        this.close();
      }
    },

    close: function() {
      this.remove();
    },

    save: function() {
      var val ='';
      if(this.$el.find('input')) {
        val = this.$el.find('input').val();
      }
      this.options.callback(val);
      this.close();
    },

    initialize: function (options) {
      this.options = options;
    }
  });

  return Modal;
});