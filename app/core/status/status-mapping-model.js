define(['backbone'], function (Backbone) {
  return Backbone.Model.extend({
    initialize: function (attributes, options) {
      this.tableStatus = options.tableStatus;
    }
  })
});
