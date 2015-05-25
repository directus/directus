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

      switch(this.options.type) {
        case 'prompt':
          data.isPrompt = true;
          data.showInput = true;
          break;
        case 'yesnocancel':
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
      },
      'click #okBtn': function() {
        this.close();
      }
    },

    onKeydown: function(e) {
      var key = e.keyCode || e.which;
      //enter
      if (key === 13) {
        this.save();
      }
      // esc
      if (key === 27) {
        this.close();
      }
    },

    close: function() {
      this.remove();
      $(document).off('keydown', _.bind(this.onKeydown, this));
    },

    save: function() {
      var val ='';
      if(this.$el.find('input')) {
        val = this.$el.find('input').val();
      }

      if (_.isFunction(this.options.callback)) {
        this.options.callback(val);
      }

      this.close();
    },

    afterRender: function(view) {
      this.$el.find('input[type="text"]').focus();
    },

    initialize: function (options) {
      this.options = options;
      $(document).on('keydown', _.bind(this.onKeydown, this));
    }
  });

  return Modal;
});