define(function() {

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
    'VARCHAR',
    'CHAR',
    'BIGINT'
  ];

  var stringTypes = [
    'VARCHAR',
    'CHAR'
  ];

  var getNumericTypes = function () {
    return numericTypes;
  };

  var cleanIdentifier = function (identifier) {
    return identifier.replace(/[^a-z0-9-_]+/ig, '_');
  };

  var cleanColumnName = function (name) {
    return cleanIdentifier(name).replace(/^[0-9]+/ig, '');
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

  return {
    getNumericTypes: getNumericTypes,
    isNumericType: isNumericType,
    dateColumns: dateColumns,
    numericColumns: numericColumns,
    primaryColumns: primaryColumns,
    cleanColumnName: cleanColumnName,
    supportsLength: supportsLength,
    cleanTableName: cleanIdentifier
  }
});
