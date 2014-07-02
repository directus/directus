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

    close: function() {
      this.remove();
    },

    save: function() {
      var val ='';
      if(this.$el.find('input')) {
        val = this.$el.find('input').val()
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