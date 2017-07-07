define([
  'app',
  'backbone',
  'moment',
  'core/entries/EntriesCollection',
  'modules/messages/MessageModel'
], function(app, Backbone, moment, EntriesCollection, MessageModel) {

  return EntriesCollection.extend({

    model: MessageModel,

    updateFrequency: 10000,

    filters: {columns_visible: ['from','subject','date_updated'], sort: 'date_updated', sort_order: 'DESC'},

    comparator: function (modelA, modelB) {
      // Order the data by timestamp
      return -moment(modelA.get('date_updated')).diff(moment(modelB.get('date_updated')));
    },

    parse: function (response) {
      if (response === null) return [];

      // TODO: Send messages in new format when loading from index page
      // Or better yet don't do it, as we are splitting the API with the client
      // and use the new format
      var meta = response.meta || response;

      if (meta.max_id !== undefined) {
        this.maxId = meta.max_id;
        this.unread = meta.unread;
        this.total = meta.total;
      }

      return response.data;
    }
  });
});
