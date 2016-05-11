define(function(require, exports) {

  'use strict';

  var Backbone = require('backbone');

  var addPrimaryColumnToModel = function(model) {
    if (model.collection && model.collection.junctionStructure) {
      model = model.collection.junctionStructure;
    }

    if (model.table && model.table.has('primary_column') && model.table.get('primary_column') != 'id') {
      model.idAttribute = model.table.get('primary_column');
      model.id = model.get(model.idAttribute);
      model.collection._byId[model.id] = model;
    }
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
