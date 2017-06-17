define([
  'core/t',
  'underscore',
  'backbone'
], function (__t, _, Backbone) {

  'use strict';

  // @TODO: Add an object that handle supported values by types
  var dateTypes = ['DATETIME', 'DATE'];
  var decimalTypes = [
    'FLOAT',
    'DOUBLE',
    'DECIMAL',
    'NUMERIC'
  ];
  var numericTypes = [
    'TINYINT',
    'SMALLINT',
    'MEDIUMINT',
    'INT',
    'YEAR',
    'BIGINT'
  ].concat(decimalTypes);

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

  var isDecimalType = function (type) {
    return decimalTypes.indexOf(type) >= 0;
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
      // NOTE: After we merge the synced data with the existing model this trigger a render event
      // because the model "changed" with the new synced values
      // which make the columns options not a UIModel anymore but a plain object
      // TODO: Make the column options parsed to UIModel
      var option = columnOptions instanceof Backbone.Model ? columnOptions.get(optionName) : columnOptions;

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
    isDecimalType: isDecimalType,
    isStringType: isStringType,
    dateColumns: dateColumns,
    numericColumns: numericColumns,
    primaryColumns: primaryColumns,
    cleanColumnName: cleanColumnName,
    supportsLength: supportsLength,
    cleanTableName: cleanIdentifier
  }
});
