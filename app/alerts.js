define([
  'app',
  'core/notification'
], function(app, Notification) {

  'use strict';
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
    // $('a[href$="#activity"] span').removeClass('icon-bell').addClass('icon-cycle');
    app.activityInProgress = true;
    // $('#page-blocker').show();
    $('#header').find('.logo').removeClass('static');
    //app.lockScreen();
  };

  var hideProgressNotification = function () {
    app.activityInProgress = false;

    // Stop animation after cycle completes
    $('#header').find('.logo').one('animationiteration webkitAnimationIteration', function() {
      $(this).addClass('static');
    });

    //app.unlockScreen();
  };

  var onAppLoaded = function () {
    $('.loading').removeClass('blocking fade');
  };

  // listen to alter events!
  app.on('progress', showProgressNotification);
  app.on('load', hideProgressNotification);
  app.on('loaded', onAppLoaded);

  app.on('alert:error', function(title, details, showDetails, moreOptions) {
    Notification.error(title, details, moreOptions);
  });
});
