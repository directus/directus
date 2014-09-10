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
      return data;
    },

    events: {
      'click #cancel': function() {
        this.close();
      },
      'click #save': function() {
        this.save();
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
        val = this.$el.find('input').val()
      }
      this.options.callback(val);
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