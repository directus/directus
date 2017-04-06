define(['backbone', './status-mapping-model'], function (Backbone, StatusMappingModel) {
  return Backbone.Collection.extend({

    model: StatusMappingModel,

    parse: function (resp) {
      return resp;
    },

    initialize: function (models, options) {
      this.options = options;
    }
  });
});
