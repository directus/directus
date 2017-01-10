define([
  'app',
  'backbone',
  'underscore',
  'core/t',
  'core/notification'
],

function(
  app,
  Backbone,
  _,
  __t,
  Notification
) {

  'use strict';

  return function(options, context) {

    var opts = _.extend({
      value: false,
      name: '',
      firstQuestion: __t('confirm_question'),
      secondQuestion: __t('confirm_question_confirm'),
      emptyValueMessage: __t('confirm_invalid_value'),
      notMatchMessage: __t('confirm_value_did_not_match'),
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
      if (will !== 'yes') {
        return;
      }

      app.router.openModal({type: 'prompt', text: opts.secondQuestion, callback: function(confirmedValue) {
        if (confirmedValue !== opts.value) {
          Notification.error(__t('confirm_did_not_match'), opts.notMatchMessage);
          return;
        }

        opts.callback.apply(context);
     }});
    }});
  }
});
