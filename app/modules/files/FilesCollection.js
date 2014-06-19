define([
  "app",
  "backbone",
  "core/entries/EntriesCollection",
  "modules/files/FilesModel"
],

function(app, Backbone, EntriesCollection, FilesModel) {

  return EntriesCollection.extend({

    model: FilesModel,

    initialize: function() {
      EntriesCollection.prototype.initialize.apply(this, arguments);
    }

  });

});