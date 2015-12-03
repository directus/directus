define(['app', 'backbone', 'noty', 'noty_theme'], function(app, Backbone) {
  'use strict';

  var defaultOptions = {
    theme: 'directus'
  };

  function createNotification(options, type) {
    options = _.extend(defaultOptions, options || (options = {}));

    if (typeof type === 'string') {
      options.type = type;
    }

    return noty(options);
  }

  //@TODO: Wrap Noty into a Notification Object
  function showNotification(options) {
    return createNotification(options);
  }

  function showError(options) {
    return createNotification(options, 'error');
  }

  function showInfo(options) {
    return createNotification(options, 'information');
  }

  function showWarning(options) {
    return createNotification(options, 'warning');
  }

  function showSuccess(options) {
    return createNotification(options, 'success');
  }

  return {
    show: showNotification,
    alert: showNotification,
    error: showError,
    info: showInfo,
    warning: showWarning,
    success: showSuccess
  };
});