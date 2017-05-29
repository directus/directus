define([
  'core/t', 'underscore'
], function (__t, _) {

  'use strict';

  // @TODO: Add an object that handle supported values by types
  var dateTypes = ['DATETIME', 'DATE'];
  var numericTypes = [
    'TINYINT',
    'SMALLINT',
    'MEDIUMINT',
    'INT',
    'FLOAT',
    'YEAR',
    'DOUBLE',
    'BIGINT'
  ];

  var stringTypes = [
    'VARCHAR',
    'CHAR'
  ];

  var getNumericInterfaceTypes = function () {
    return numericTypes.concat(stringTypes);
  };

  var cleanIdentifier = function (identifier) {
    return (identifier || '').replace(/[^a-z0-9-_]+/ig, '_').toLowerCase();
  };

  var cleanColumnName = function (name) {
    return cleanIdentifier(name).replace(/^[0-9]+/ig, '').toLowerCase();
  };

  var filterColumns = function (structure, type, excludeSystems) {
    excludeSystems = excludeSystems === true;

    return structure.filter(function (model) {
      var hasType = type.indexOf(model.get('type')) >= 0;
      var isSystem = model.get('system');

      if (excludeSystems) {
        return hasType && !isSystem;
      }

      return hasType;
    })
  };

  var dateColumns = function (structure, excludeSystems) {
    return filterColumns(structure, dateTypes, excludeSystems);
  };

  var numericColumns = function (structure, excludeSystems) {
    return filterColumns(structure, numericTypes, excludeSystems);
  };

  var primaryColumns = function (structure) {
    return structure.filter(function (model) {
      return model.get('key') === 'PRI';
    });
  };

  var isStringType = function (type) {
    return stringTypes.indexOf(type) >= 0;
  };

  var isNumericType = function (type) {
    return numericTypes.indexOf(type) >= 0;
  };

  var supportsLength = function (type) {
    return isStringType(type) || isNumericType(type) || ['ENUM', 'SET'].indexOf(type) >= 0;
  };

  var isMissingRequiredOptions = function (column) {
    var UIManager = require('core/UIManager');
    var uiOptionsName = UIManager.getRequiredOptions(column.get('ui'));
    var columnOptions = column.get('options');
    var missing = false;

    _.each(uiOptionsName, function (optionName) {
      var option = columnOptions.get(optionName);

      if (!option || _.isEmpty(option)) {
        missing = true;
      }
    });

    return missing;
  };

  var isSystem = function (uiId) {
    var UIManager = require('core/UIManager');

    // TODO: Compare against a column model
    return UIManager.isSystem(uiId);
  };

  var getSystemDefaultComment = function (uiId) {
    var comment = '';

    uiId  = (uiId || '').toLowerCase();

    if (!isSystem(uiId)) {
      return comment;
    }

    switch (uiId) {
      case 'primary_key':
        comment = __t('system_primary_key_comment');
        break;
      case 'status':
        comment = __t('system_status_comment');
        break;
      case 'sort':
        comment = __t('system_sort_comment');
        break;
    }

    return comment;
  };

  return {
    getSystemDefaultComment: getSystemDefaultComment,
    isMissingRequiredOptions: isMissingRequiredOptions,
    isSystem: isSystem,
    getNumericInterfaceTypes: getNumericInterfaceTypes,
    isNumericType: isNumericType,
    isStringType: isStringType,
    dateColumns: dateColumns,
    numericColumns: numericColumns,
    primaryColumns: primaryColumns,
    cleanColumnName: cleanColumnName,
    supportsLength: supportsLength,
    cleanTableName: cleanIdentifier
  }
});
