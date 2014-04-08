define([
  "app",
  "backbone",
  "core/entries/EntriesModel"
],

function(app, Backbone, EntriesModel) {

  var MediaModel = EntriesModel.extend({

    initialize: function() {
      EntriesModel.prototype.initialize.apply(this, arguments);
    },

    makeMediaUrl: function(thumbnail) {
      var storageAdapters = app.storageAdapters,
          adapterId,
          storageAdapter;

      if(thumbnail) {
        adapterId = 'THUMBNAIL';
        if(!storageAdapters.hasOwnProperty(adapterId)) {
          throw new Error("Cannot find default thumbnail storage_adapter using key: " + adapterId);
        }
      } else {
        adapterId = this.get('storage_adapter');
        if(!storageAdapters.hasOwnProperty(adapterId)) {
          throw new Error("Media record's storage_adapter FK value maps to an undefined directus_storage_adapters record: " + adapterId);
        }
      }
      storageAdapter = storageAdapters[adapterId];
      var url = storageAdapter.url + this.get('name');
      return url;
    },

    constructor: function MediaModel(data, options) {
      MediaModel.__super__.constructor.call(this, data, options);
    }

  });

  return MediaModel;

});