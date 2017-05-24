//  Directus Utils
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['underscore'], function (_) {

  'use strict';

  var Utils = {};

  Utils.encodeQueryParams = function (data) {
    var params = [];
    for (var k in data) {
      params.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
    }
    return params.join('&');
  };

  // Source: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
  Utils.argumentsToArray = function(argObject) {
    var args = new Array(argObject.length);

    for (var i = 0; i < args.length; i++) {
      args[i] = argObject[i];
    }

    return args;
  };

  /**
   * Convert string url into an Location (Anchor) Element.
   *
   * @param {string} url
   * @return {Element} location
   */
  Utils.convertURLToLocation = function(url) {
    var location = document.createElement('a');
    location.href = url;

    return location;
  };

  /**
   * Get Location (Anchor) Element or convert url to one.
   *
   * @param {string/location} url
   * @return {Element} new url
   */
  Utils.getLocation = function(url) {
    return url.href ? url : this.convertURLToLocation(url);
  };

  /**
   * Get array of params in a url
   *
   * @param {string}/{location} url
   * @return {Array} new url
   */
  Utils.getParams = function(url) {
    var location = this.getLocation(url);
    var querystring = location.search;

    var params = [];
    if (querystring && querystring.indexOf('?') === 0) {
      params = querystring.substr(1).split('&');
    }

    return params;
  };

  /**
   * Add a param to an url query string
   *
   * @param {string}/{location} url
   * @param {string} key - Param key
   * @param {string} value - New param value
   * @param {boolean} [encodeKey=true] - Whether to encode the param key.
   * @param {boolean} [encodeValue=true] - Whether to encode the param value.
   * @return {string} new url
   */
  Utils.addParam = function(url, key, value, encodeKey, encodeValue) {
    var location = this.getLocation(url);
    var params = this.getParams(url);
    var keyExistsAtIndex = -1;
    var paramFound = null;

    encodeKey = typeof encodeKey === 'undefined' ? true : !!encodeKey;
    encodeValue = typeof encodeValue  === 'undefined' ? true : !!encodeValue;

    if (params) {
      for (var index in params) {
        var param = params[index];
        var result = param.indexOf('=') ? param.split('=') : param;

        if (result[0] === key || result[0] === encodeURIComponent(key)) {
          keyExistsAtIndex = index;
          paramFound = result;
        }
      }
    }

    key = encodeKey ? encodeURIComponent(key) : key;
    value = encodeValue ? encodeURIComponent(value) : value;

    if (keyExistsAtIndex >= 0) {
      params[keyExistsAtIndex] = paramFound[0]+'='+value;
    } else {
      params.push(key+'='+value);
    }

    location.search = '?'+params.join('&');

    return location.href;
  };

  Utils.convertToBoolean = function(value) {
    return value == null ? false : value != false;
  };

  Utils.isEmpty = function(value) {
    return value == null || value === '';
  };

  /**
   * Returns a function, that, as long as it continues to be invoked, will not be triggerd.
   * The function will be called after it stops being called for N ms.
   * Based on https://github.com/component/debounce/blob/master/index.js which in turn is based on the
   * original implemenation in Underscore (both licensed MIT)
   */
  Utils.debounce = function(func, wait, immediate) {
    var timeout;
    var args;
    var context;
    var timestamp;
    var result;

    if (null == wait) {
      wait = 100;
    }

    function later() {
      var last = Date.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    }

    var debounced = function () {
      context = this;
      args = arguments;
      timestamp = Date.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };

    debounced.clear = function () {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    debounced.flush = function () {
      if (timeout) {
        result = func.apply(context, args);
        context = args = null;

        clearTimeout(timeout);
        timeout = null;
      }
    };

    return debounced;
  };

  Utils.isNothing = function (value) {
    return value === undefined
        || value === null
        || value === ''
        || (!_.isNumber(value)  && !_.isDate(value) && _.isEmpty(value) && !_.isBoolean(value));
  };

  Utils.clearElement = function(element) {
    element.wrap('<form>').closest('form').get(0).reset();
    element.unwrap();
  };

  return Utils;
});
