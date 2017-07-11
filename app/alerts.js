define([
  'app',
  'core/notification'
], function (app, Notification) {

  'use strict';

  var showProgressNotification = function () {
    app.activityInProgress = true;
    $('#header').find('.logo').removeClass('static');
    $('#page-blocker').addClass('blocking');
    app.lockScreen();
  };

  var hideProgressNotification = function () {
    app.activityInProgress = false;
    // Stop animation after cycle completes
    $('#header').find('.logo').one('animationiteration webkitAnimationIteration', function() {
      $(this).addClass('static');
    });

    $('#page-blocker').removeClass('blocking');
    app.unlockScreen();
  };

  var onAppLoaded = function () {
    $('.loading').removeClass('blocking fading');
  };

  // listen to alter events!
  app.on('progress', showProgressNotification);
  app.on('load', hideProgressNotification);
  app.on('loaded', onAppLoaded);

  app.on('alert:error', function(title, details, showDetails, moreOptions) {
    if (!app.isLocked()) {
      Notification.error(title, details, moreOptions);
    }
  });

  app.on('alert:warning', function(title, details, showDetails, moreOptions) {
    if (!app.isLocked()) {
      Notification.warning(title, details, moreOptions);
    }
  });
});
