define([
  'app',
  'core/notification'
], function (app, Notification) {

  'use strict';

  var showProgressNotification = function () {
    app.activityInProgress = true;
    // $('#page-blocker').show();
    $('#header').find('.logo').removeClass('static');
    // app.lockScreen();
  };

  var hideProgressNotification = function () {
    app.activityInProgress = false;

    // Stop animation after cycle completes
    $('#header').find('.logo').one('animationiteration webkitAnimationIteration', function() {
      $(this).addClass('static');
    });

    // app.unlockScreen();
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

  app.on('alert:warning', function(title, details, showDetails, moreOptions) {
    Notification.warning(title, details, moreOptions);
  });
});
