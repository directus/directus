define([
  'core/t',
  'underscore',
  'backbone'
], function (__t, _, Backbone) {

  'use strict';

  // All types must be unique
  var types = {
    DATE: {
      DATETIME: null,
      DATE: null
    },
    DECIMAL: {
      FLOAT: {length: '10,2'},
      DOUBLE: {length: '10,2'},
      DECIMAL: {length: '10,2'},
      NUMERIC: {length: '10,2'}
    },
    INTEGER: {
      // NOTE: set INT as default. first = default
      INT: {length: 11},
      TINYINT: {length: 1},
      SMALLINT: {length: 5},
      MEDIUMINT: {length: 7},
      BIGINT: {length: 18},
      YEAR: {length: 4}
    },
    STRING: {
      CHAR: {length: 1},
      VARCHAR: {length: 100}
    }
  };

  function getTypes(group) {
    var typesGroup = types[group];

    if (group) {
      typesGroup = _.keys(typesGroup);
    }

    return typesGroup;
  }

  function getTypesWithoutGroup() {
    var list = {};

    _.each(types, function (type) {
      _.each(type, function (value, key) {
        list[key] = value;
      });
    });

    return list;
  }

  function getType(name) {
    var types = getTypesWithoutGroup();

    return _.find(types, function (value, key) {
      if (key === name) {
        return true;
      }
    });
  }

  // @TODO: Add an object that handle supported values by types
  var dateTypes = getTypes('DATE');
  var decimalTypes = getTypes('DECIMAL');
  var numericTypes = getTypes('INTEGER').concat(decimalTypes);
  var stringTypes = getTypes('STRING');

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

  var getTypeDefaultLength = function (name) {
    var type = getType(name);

    return type && type.length ? type.length : null;
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
      var option;
      if (columnOptions instanceof Backbone.Model) {
        option = columnOptions.get(optionName);
      } else {
        try {
          columnOptions = JSON.parse(columnOptions);
          option = _.result(columnOptions, optionName);
        } catch (e) {
          // bad json
        }
      }

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
    getTypeDefaultLength: getTypeDefaultLength,
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
