define([
  'app',
  'backbone',
  'core/notification'
],

function(
  app,
  Backbone,
  Notification
) {

  'use strict';

  return function(options, context) {

    var opts = _.extend({
      value: false,
      name: '',
      firstQuestion: 'Are you sure?.',
      secondQuestion: 'This cannot be undone.',
      emptyValueMessage: 'Invalid value.',
      notMatchMessage: 'Values did not match.',
      callback: function() {}
    }, options);

    if (!context) {
      context = this;
    }

    if (!opts.value) {
      Notification.error('Error', opts.emptyValueMessage);
      return;
    }

    app.router.openModal({type: 'yesno', text: opts.firstQuestion, callback: function(will) {
      if (will != 'yes') {
        return;
      }

      app.router.openModal({type: 'prompt', text: opts.secondQuestion, callback: function(confirmedValue) {
        if (confirmedValue !== opts.value) {
          app.router.openModal({type: 'alert', text: opts.notMatchMessage});
          return;
        }

        opts.callback.apply(context);
     }});
    }});
  }
});