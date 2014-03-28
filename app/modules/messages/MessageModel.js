define([
  "app",
  "backbone",
  "core/entries/EntriesModel"
],

function(app, Backbone, EntriesModel) {
  return EntriesModel.extend({

    getUnreadCount: function() {
      var unread = this.get('read') == 1 ? 0 : 1;

      var unreadResponses = this.get('responses').reduce(function(memo, model){
        var unread = model.get('read') == 1 ? 0 : 1;
        return memo + unread;
      }, 0);

      return unread + unreadResponses;
    },

    markAsRead: function(options) {
      options = options || {};

      var unreadCount = this.getUnreadCount();

      // Do nothing if model is allready read
      if (unreadCount === 0) {
        return;
      }

      // Decrease unread counter
      this.collection.unread -= unreadCount;

      if (options.save) {
        return this.save({read: 1}, {patch: true, silent: true});
      }

      return this.set({read: "1"}, {silent: true});
    }

  });
});