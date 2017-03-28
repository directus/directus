define(function(require, exports) {

  'use strict';

  var Backbone = require('backbone');

  var addPrimaryColumnToModel = function (model) {
    var table;

    if (model.collection && model.collection.junctionStructure) {
      model = model.collection.junctionStructure;
    }

    table = model.table;
    if (table && table.hasPrimaryColumn() && table.getPrimaryColumnName() !== 'id') {
      model.idAttribute = table.getPrimaryColumnName();
      // model.id = model.get(model.idAttribute);
      // model.collection._byId[model.id] = model;
    }
  };

  return {
    setIdAttribute: function (model) {
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
