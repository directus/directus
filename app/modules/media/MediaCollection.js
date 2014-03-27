define([
  "app",
  "backbone",
  "core/entries/EntriesCollection",
  "modules/media/MediaModel"
],

function(app, Backbone, EntriesCollection, MediaModel) {

  return EntriesCollection.extend({

    model: MediaModel,

    initialize: function() {
      EntriesCollection.prototype.initialize.apply(this, arguments);
      console.log('init media collection');
    }

  });

});