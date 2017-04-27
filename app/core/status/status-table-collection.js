define(['backbone', 'underscore', './status-table-model'], function (Backbone, _, StatusTableModel) {
  return Backbone.Collection.extend({

    model: StatusTableModel,

    parse: function (resp) {
      var mappings = [];

      _.each(resp, function (values, key) {
        mappings.push(_.extend({id: key}, values));
      });

      return mappings;
    },

    _get: function (id) {
      return Backbone.Collection.prototype.get.apply(this, arguments);
    },

    get: function (id, getDefault) {
      if (getDefault === true) {
        id = id || '*';
      }

      var model = this._get(id);

      if (getDefault && id !== '*' && !model) {
        model = this._get('*');
      }

      return model;
    }
  });
});
