define(function() {

  'use strict';

  var UIHelper = {};

  UIHelper.supportsTime = function(type) {
    return _.contains(['DATETIME', 'TIME', 'TIMESTAMP'], type);
  };

  UIHelper.supportsDate = function(type) {
    return _.contains(['DATETIME', 'DATE', 'TIMESTAMP'], type);
  };

  UIHelper.supportsNumeric = function(type) {
    return _.contains([
      'BIGINT',
      'BIT',
      'DECIMAL',
      'DOUBLE',
      'FLOAT',
      'INTEGER',
      'INT',
      'MEDIUMINT',
      'NUMERIC',
      'SMALLINT',
      'TINYINT'
    ], type);
  };

  return UIHelper;
});
