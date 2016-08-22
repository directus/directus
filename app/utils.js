//  Directus Utils
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(function() {

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

  return Utils;
});
