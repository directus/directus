define([
  "app",
  "backbone",
  "core/entries/EntriesCollection",
  "modules/users/UsersModel"
],

function(app, Backbone, EntriesCollection, UsersModel) {

  return EntriesCollection.extend({

    model: UsersModel,

    initialize: function() {
      EntriesCollection.prototype.initialize.apply(this, arguments);
    }

  });

});