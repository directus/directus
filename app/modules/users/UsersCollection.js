define([
  'app',
  'backbone',
  'underscore',
  'core/entries/EntriesCollection',
  'core/t',
  'modules/users/UsersModel'
], function(app, Backbone, _, EntriesCollection, __t, UsersModel) {

  return EntriesCollection.extend({

    model: UsersModel,

    getCurrentUser: function () {
      return app.user;
    },

    get: function (id, emptyObject) {
      var user = EntriesCollection.__super__.get.call(this, id);
      if (emptyObject !== false && !_.isObject(id) && !user) {
        user = new UsersModel({
          id: id,
          first_name: __t('a_missing_or_removed_user'),
          last_name: ''
        });
      }

      return user;
    },

    onAdd: function (model) {
      // Add email to the lookup table
      this._byId[model.get('email')] = model;
    },

    onRemove: function (model) {
      // Remove email to the lookup table
      delete this._byId[model.get('email')];
    },

    initialize: function () {
      EntriesCollection.prototype.initialize.apply(this, arguments);

      this.on('add', this.onAdd, this);
      this.on('remove', this.onRemove, this);
    }
  });
});
