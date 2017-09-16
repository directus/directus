define([
  'app',
  'backbone',
  'core/entries/EntriesModel',
  'moment-tz'
],

function(app, Backbone, EntriesModel, moment) {

  return EntriesModel.extend({

    getFullName: function () {
      return this.get('first_name') + ' ' + this.get('last_name');
    },

    canEdit: function (attribute) {
      // hotfix: admin can edit user
      if (app.user.isAdmin()) {
        return true;
      }

      return EntriesModel.prototype.canEdit.apply(this, arguments);
    },

    canSendMessages: function () {
      return this.canXMessage('add');
    },

    canReadMessages: function () {
      return this.canXMessage('view');
    },

    canXMessage: function (privilege) {
      var messagesPrivileges = app.schemaManager.getPrivileges('directus_messages');
      var recipientsPrivileges = app.schemaManager.getPrivileges('directus_messages_recipients');

      return messagesPrivileges && messagesPrivileges.can(privilege)
        && recipientsPrivileges && recipientsPrivileges.can(privilege);
    },

    canUploadFiles: function () {
      var privilege = app.schemaManager.getPrivileges('directus_files');

      return privilege && privilege.can('add');
    },

    getGroup: function () {
      var group = this.get('group');

      if (!(group instanceof EntriesModel)) {
        group = app.groups.get(group);
      }

      return group;
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

    getDefaultAvatar: function () {
      return app.PATH + 'assets/imgs/missing-user.svg';
    },

    isAdmin: function () {
      return this.getGroup().id === 1;
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
      var d1 = moment().tz(this.get('timezone'));
      var d2 = moment().tz(userModel.get('timezone'));

      if (!d1 || !d2) {
        return null;
      }

      return (d2.utcOffset() - d1.utcOffset()) / 60;
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

      app.request('POST', '/users/tracking/page', {
        global: false,
        data: {
          last_page: lastPage
        }
      });
    },

    isMe: function () {
      return this.isMine();
    },

    constructor: function UsersModel() {
      EntriesModel.prototype.constructor.apply(this, arguments);
    }
  });
});
