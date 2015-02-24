define([
  "app",
  "backbone",
  "core/entries/EntriesModel"
],

function(app, Backbone, EntriesModel) {

  return EntriesModel.extend({
    
    getAvatar: function() {
      var currentUserAvatar = this.get('avatar');
      if (this.get('avatar_file_id') && this.get('avatar_file_id').has('name') && this.get('avatar_is_file') == 1) {
        currentUserAvatar = this.get('avatar_file_id').makeFileUrl(true);
      } else if(!currentUserAvatar) {
        currentUserAvatar = this.getDefaultAvatar();
      } else {
        currentUserAvatar = currentUserAvatar.replace('?s=100','?s=200');
      }
      
      return currentUserAvatar;
    },

    getDefaultAvatar: function() {
      return app.PATH + 'assets/img/missing-directus-avatar.png';
    },
    
    initialize: function() {
      EntriesModel.prototype.initialize.apply(this, arguments);
    }
  
  });

});