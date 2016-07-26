define([
  "app",
  "backbone",
  "core/entries/EntriesCollection",
  "modules/users/UsersModel"
],

function(app, Backbone, EntriesCollection, UsersModel) {

  return EntriesCollection.extend({

    model: UsersModel,

    getCurrentUser: function() {
      var authenticatedUser = app.authenticatedUserId;
      return this.get(authenticatedUser.id);
    },

    get: function(id) {
      var user = EntriesCollection.__super__.get.call(this, id);
      if (!_.isObject(id) && !user) {
        user = new UsersModel({id: id});
        this.add(user);
      }

      return user;
    },

    initialize: function() {
      EntriesCollection.prototype.initialize.apply(this, arguments);
    }

  });

});
