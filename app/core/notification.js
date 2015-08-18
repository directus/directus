define(['app', 'backbone', 'noty', 'noty_theme'], function(app, Backbone) {
  'use strict';

  //@TODO: Wrap Noty into a Notification Object
  var Notification = function(options) {
    return noty(options);
  };
  return Notification;
});