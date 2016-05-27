define(['app', 'backbone', 'utils', 'noty', 'noty_theme'], function(app, Backbone, Utils) {
  'use strict';

  var defaultOptions = {
    theme: 'directus'
  };

  function createNotification(title, details, type, options) {
    options = _.extend(defaultOptions, options || (options = {}));

    if (typeof type === 'string') {
      options.type = type;
    }

    var titleText = '';
    if (title) {
      titleText += '<b>'+title+'</b><br>';
    }

    options.text = titleText+details;

    return noty(options);
  }

  //@TODO: Wrap Noty into a Notification Object
  function showNotification(options) {
    var args = Utils.argumentsToArray(arguments);
    args.splice(2, 0, null);
    return createNotification.apply(this, args);
  }

  function showError(options) {
    var args = Utils.argumentsToArray(arguments);
    args.splice(2, 0, 'error');
    return createNotification.apply(this, args);
  }

  function showInfo(options) {
    var args = Utils.argumentsToArray(arguments);
    args.splice(2, 0, 'information');
    return createNotification.apply(this, args);
  }

  function showWarning(options) {
    var args = Utils.argumentsToArray(arguments);
    args.splice(2, 0, 'warning');
    return createNotification.apply(this, args);
  }

  function showSuccess(options) {
    var args = Utils.argumentsToArray(arguments);
    args.splice(2, 0, 'success');
    return createNotification.apply(this, args);
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
