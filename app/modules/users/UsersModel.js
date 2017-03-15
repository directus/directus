define([
  'app',
  'backbone',
  'core/entries/EntriesModel',
  'moment-tz'
],

function(app, Backbone, EntriesModel, moment) {

  return EntriesModel.extend({

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

    getDefaultAvatar: function () {
      return app.PATH + 'assets/img/missing-directus-avatar.png';
    },

    isAdmin: function () {
      return this.get('group').get('id') === 1;
    },

    isOnline: function () {
      var lastAccess = this.get('last_access');
      var isOnline = false;

      if (lastAccess) {
        isOnline = moment(lastAccess).add(5, 'minutes') > moment();
      }

      return isOnline;
    },

    timezoneDifference: function (userModel) {
      var d1 = moment().tz(this.get('timezone')).utcOffset();
      var d2 = moment().tz(userModel.get('timezone')).utcOffset();

      return (d2-d1) / 60;
    },

    lastSeen: function () {
      // @TODO: Add translation or a standard way to say "Not Available" or similar
      return this.get('last_access') ? moment(this.get('last_access')).fromNow() : 'N/A';
    },

    updateLastRoute: function (route, history) {
      var currentPath = history.fragment;
      var queryString = history.location.search || '';
      var lastPage = JSON.stringify({
        'path': currentPath + encodeURIComponent(queryString),
        'route': route
      });

      this.save({'last_page': lastPage, 'last_access': moment().utc().format('YYYY-MM-DD HH:mm:ss')}, {
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
