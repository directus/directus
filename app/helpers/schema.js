define(function() {

  'use strict';

  function cleanIdentifier(identifier) {
    return identifier.replace(/[^a-z0-9-_]+/ig, '_');
  }

  function cleanColumnName(name) {
    return cleanIdentifier(name).replace(/^[0-9]+/ig, '');
  }

  return {
    cleanColumnName: cleanColumnName,
    cleanTableName: cleanIdentifier
  }
});
