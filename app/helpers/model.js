define(function(require, exports) {

  'use strict';

  var Backbone = require('backbone');

  var addPrimaryColumnToModel = function(model) {
    if (model.junctionStructure) {
      model.idAttribute = model.junctionStructure.table.get('primary_column');
    } else {
      model.idAttribute = model.table.get('primary_column');
    }
    model.id = model.get(model.idAttribute);
    model.collection._byId[model.id] = model;
  }

  return {
    setIdAttribute: function(model) {
      if (!model) {
        return;
      }

      if (model.table.id.indexOf('directus_') === 0) {
        return;
      }

      if (model instanceof Backbone.Collection) {
        model.each(addPrimaryColumnToModel);
      } else {
        addPrimaryColumnToModel(model);
      }
    }
  }
});