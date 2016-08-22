define([
  'app',
  'backbone',
  'core/entries/EntriesModel',
  'moment'
],

function(app, Backbone, EntriesModel, moment) {

  return EntriesModel.extend({

    defaults: {
      first_name: '',
      last_name: ''
    },

    getAvatar: function() {
      var currentUserAvatar = this.get('avatar');
      if (this.get('avatar_file_id') && this.get('avatar_file_id').has('name')) {
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

    updateLastRoute: function(route, history) {
      var currentPath = history.fragment;
      var queryString = history.location.search || '';
      var lastPage = JSON.stringify({
        'path': currentPath + encodeURIComponent(queryString),
        'route': route
      });

      this.save({'last_page': lastPage, 'last_access': moment().format('YYYY-MM-DD HH:mm')}, {
        patch: true,
        global: false,
        silent: true,
        wait: true,
        validate: false,
        url: this.url() + "?skip_activity_log=1"
      });
    }

  });

});
