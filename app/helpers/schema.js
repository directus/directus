define(function() {

  'use strict';

  var dateTypes = ['DATETIME', 'DATE'];
  var numericTypes = ['INT'];

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

  return {
    dateColumns: dateColumns,
    numericColumns: numericColumns,
    primaryColumns: primaryColumns,
    cleanColumnName: cleanColumnName,
    cleanTableName: cleanIdentifier
  }
});
