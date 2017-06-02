define(['moment', 'underscore', 'jquery', 'core/interval'], function (moment, _, $, interval) {
  'use strict';

  // time in milliseconds before update
  var waitTime = 60000;
  // loop through all the contextual date updater
  // every 60s and update its contextual date
  var updateTime = function () {
    var $elements = $('.contextual-date-updater[data-date]');

    _.each($elements, function (element) {
      var $element = $(element);
      var date = moment($element.data('date'));

      // @TODO: update gradually
      // update by minutes until an hour
      // update by hour until 24
      // update by date? maybe is too much
      if (date.isValid()) {
        $element.text(date.fromNow());
      }
    });
  };

  interval(updateTime, waitTime);
});
