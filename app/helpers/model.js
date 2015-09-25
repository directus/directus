define(function(require, exports) {

  'use strict';

  var Backbone = require('backbone');

  var addPrimaryColumnToModel = function(model) {
    if (model.collection.junctionStructure) {
      model.idAttribute = model.collection.junctionStructure.table.get('primary_column');
    } else {
      model.idAttribute = model.table.get('primary_column');
    }

    if (!model.idAttribute) {
      model.idAttribute = 'id';
    }

    model.id = model.get(model.idAttribute);
    model.collection._byId[model.id] = model;
  }

  return {
    setIdAttribute: function(model) {
      if (!model) {
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