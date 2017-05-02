define(['backbone', './status-mapping-collection'], function (Backbone, StatusMappingCollection) {
  return Backbone.Model.extend({
    parse: function (resp) {

      resp.mapping = new StatusMappingCollection(resp.mapping, {
        parse: true,
        tableStatus: this
      });

      return resp;
    },

    getDeleteValue: function () {
      return this.get('delete_value');
    }
  });
});
