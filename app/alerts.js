define([
  "app",
  'plugins/alertify'
], function(app, alertify) {

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
    $('a[href$="#activity"] span').removeClass('icon-bell').addClass('icon-cycle');
    app.activityInProgress = true;
    $('#page-blocker').show();
    //app.lockScreen();
  };

  var hideProgressNotification = function() {
    $('a[href$="#activity"] span').addClass('icon-bell').removeClass('icon-cycle');
    app.activityInProgress = false;
    $('#page-blocker').fadeOut(100);
    //app.unlockScreen();
  };

  // listen to alter events!
  app.on('progress', showProgressNotification);
  app.on('load', hideProgressNotification);

  app.on('alert:error', function(message, details, showDetails) {
    console.log("ERROR: " + message);
    //alertify.error(message);
/*      showDetails = showDetails || false;
      $('#loader').hide();
      var view = new ErrorView({message: message, details: details});
      hideProgressNotification();
      app.lockScreen();
      messages.insertView(view).render();
      view.render();
      if(showDetails) {
        view.$el.find('button.show-details').click();
      }*/
    });
});