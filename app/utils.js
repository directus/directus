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
  }

  return Utils;
});