define(['app', 'backbone', 'utils', 'noty', 'noty_theme'], function(app, Backbone, Utils) {
  'use strict';

  var defaultOptions = {
    theme: 'directus',
    timeout: 30000
  };

  function createNotification(title, details, type, options) {
    // if options is a number
    // it means is the delay time (in milliseconds)
    // until the notification close
    if (!isNaN(parseInt(options)) && isFinite(options)) {
      options = {
        timeout: options
      };
    }

    options = _.extend(defaultOptions, options || (options = {}));

    if (typeof type === 'string') {
      options.type = type.toLowerCase();
    }

    var titleText = '';
    if (title) {
      titleText += '<b>'+title+'</b><br>';
    }

    options.text = titleText+details;

    return noty(options);
  }

  function addTypeArgument(args, type) {
    args = Utils.argumentsToArray(args);

    if (args.length == 1) {
      args.unshift(type);
    }

    args.splice(2, 0, type);

    return args;
  }

  //@TODO: Wrap Noty into a Notification Object
  function showNotification(options) {
    var args = Utils.argumentsToArray(arguments);
    return createNotification.apply(this, args);
  }

  function showError(options) {
    var args = addTypeArgument(arguments, 'Error');
    return createNotification.apply(this, args);
  }

  function showInfo(options) {
    var args = addTypeArgument(arguments, 'Information');
    return createNotification.apply(this, args);
  }

  function showWarning(options) {
    var args = addTypeArgument(arguments, 'Warning');
    return createNotification.apply(this, args);
  }

  function showSuccess(options) {
    var args = addTypeArgument(arguments, 'Success');
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
