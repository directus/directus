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

  return Utils;
});