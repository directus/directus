define(function() {

  'use strict';

  var UIHelper = {};

  UIHelper.supportsTime = function(type) {
    return _.contains(['DATETIME', 'TIME', 'TIMESTAMP'], type);
  };

  UIHelper.supportsDate = function(type) {
    return _.contains(['DATETIME', 'DATE', 'TIMESTAMP'], type);
  };

  return UIHelper;

});
