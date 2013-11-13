define([
  "app"
], function(app) {

  "use strict";

  // Messages Container
  var messages = new Backbone.Layout({el: '#messages'});

  // Default Error View
  var ErrorView = Backbone.Layout.extend({

        showDetails: false,

        events: {
          'click button.show-details': function() {
            this.showDetails = !this.showDetails;
            this.render();
          },
          'click button.close-alert': function() {
            app.unlockScreen();
            this.remove();
          }
        },

        template: 'error',

        serialize: function() {
          return {message: this.options.message, details: this.options.details, showDetails: this.showDetails};
        }

     });

    var showProgressNotification = function(message) {
      //$('#alert-message').text(message);
      $('body').css('cursor', 'progress!important');
      $('#loader').show();
      app.lockScreen();
    };

    var hideProgressNotification = function() {
      $('#loader').fadeOut('fast');
      $('body').css('cursor', 'default');
      app.unlockScreen();
    };

    // listen to alter events!
    app.on('progress', showProgressNotification);
    app.on('load', hideProgressNotification);

    app.on('alert:error', function(message, details) {
      $('#loader').hide();
      var view = new ErrorView({message: message, details: details});
      hideProgressNotification();
      app.lockScreen();
      messages.insertView(view).render();
        view.render();
      });
});