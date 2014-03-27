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

    initialize: function() {
      EntriesCollection.prototype.initialize.apply(this, arguments);
    }

  });

});