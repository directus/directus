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

    _.each(data, function (value, key) {
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    });

    return params.join('&');
  };

  // Source: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
  Utils.argumentsToArray = function (argObject) {
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
  Utils.convertURLToLocation = function (url) {
    var location = document.createElement('a');

    location.href = url;

    return location;
  };

  /**
   * Get Location (Anchor) Element or convert url to one.
   *
   * @param {string/Location} url
   * @return {Element} new url
   */
  Utils.getLocation = function (url) {
    return url.href ? url : this.convertURLToLocation(url);
  };

  /**
   * Get array of params in a url
   *
   * @param {string/Location} url
   * @return {Array} new url
   */
  Utils.getParams = function (url) {
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
   * @param {string/Location} url
   * @param {string} key - Param key
   * @param {string} value - New param value
   * @param {boolean} [encodeKey=true] - Whether to encode the param key.
   * @param {boolean} [encodeValue=true] - Whether to encode the param value.
   *
   * @return {String} new url
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

  Utils.convertToBoolean = function (value) {
    return value == null ? false : value != false;
  };

  Utils.isEmpty = function (value) {
    return value == null || value === '';
  };

  Utils.isNothing = function (value) {
    return value === undefined
        || value === null
        || value === ''
        || (!_.isNumber(value)  && !_.isDate(value) && _.isEmpty(value) && !_.isBoolean(value));
  };

  Utils.isSomething = function (value) {
    return !Utils.isNothing(value);
  };

  Utils.clearElement = function (element) {
    element.wrap('<form>').closest('form').get(0).reset();
    element.unwrap();
  };

  Utils.joinList = function (list, separator, lastSeparator) {
    var result;

    if (lastSeparator) {
      result = list.slice(0, -1).join(', ') + ' ' + lastSeparator +  ' ' + list.slice(-1);
    } else {
      result = list.join(separator);
    }

    return result;
  };

  Utils.getTemplateVariables = function (string) {
    var variables = (string || '').match(/{{([^{}]+)}}/g);

    return (variables || []).map(function (value) {
      // remove the spaces between the variables
      // to avoid invalid variable name
      return value.slice(2, -2).trim();
    })
  };

  // NOTE: This are meant to work with single line csv
  Utils.parseCSV = function (string, options) {
    var parts = [];

    // play it safe for the end user now
    // return empty instead of an exception
    if (!_.isString(string)) {
      return [];
    }

    options || (options = {});
    string = (string  || '');
    options.trim = options.trim === undefined ? true : options.trim;

    if (string.indexOf(',') >= 0) {
      parts = string.split(',');
    } else if (string) {
      parts = [string];
    }

    return parts.map(function (name) {
      if (options.trim === true) {
        name = name.trim()
      }

      return name;
    });
  };

  Utils.parseMentions = function (string, html) {
    if (!string) {
      return '';
    }

    var offset = 0;
    var parsedString = string;

    if (html === undefined) {
      html = true;
    }

    while (true) {
        var atPos = string.indexOf('@[');

        if (atPos !== -1) {
          var spacePos = string.substring(atPos).indexOf(' ');

          if (spacePos !== -1) {
            var substring = string.substring(atPos + 2, spacePos + atPos);
            var contains = /^[0-9]|_+$/.test(substring);

            if (contains) {
              var bracketPos2 = string.indexOf(']');

              if (bracketPos2 !== -1) {
                var name = string.substring(spacePos + 1 + atPos, bracketPos2);
                var newTitle = parsedString;
                var newOffset;

                if (html === true) {
                  name = '<span class="mention-tag">' + name + '</span>';
                }

                parsedString = newTitle.substring(0, atPos + offset) + name;
                newOffset = parsedString.length;
                parsedString += newTitle.substring(bracketPos2 + offset + 1);
                string = newTitle.substring(bracketPos2 + offset + 1);
                offset = newOffset;

                continue;
              }
            }
          }
        }

        break;
    }

    return parsedString;
  };

  Utils.repeatString = function (string, times) {
    return Array(times + 1).join(string);
  };

  Utils.pad = function (position, string, fillString, times) {
    var fill = this.repeatString(fillString, times);
    var result;

    if (position === 'right') {
      result = string + fill;
    } else {
      result = fill + string;
    }

    return result.slice(-times);
  };

  Utils.leftPad = function (string, fillString, times) {
    return this.pad('left', string, fillString, times);
  };

  Utils.rightPad = function (string, fillString, times) {
    return this.pad('right', string, fillString, times);
  };

  return Utils;
});
