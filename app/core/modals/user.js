define(['app', 'core/Modal'], function(app, Modal) {

  'use strict';

  return Modal.extend({

    template: 'modal/user',

    attributes: {
      'id': 'modal',
      'class': 'modal profile'
    },

    events: {
      'click .js-edit-user': 'editUser'
    },

    editUser: function (event) {
      var id = $(event.currentTarget).data('id');

      this.listenToOnce(this, 'close', function () {
        app.router.go(['users', id]);
      });

      this.close(true);
    },

    serialize: function () {
      var data = this.model.toJSON();
      var authenticatedUser = app.users.getCurrentUser();

      data.online = this.model.isOnline();
      data.lastSeen = this.model.lastSeen();
      data.isAdmin = authenticatedUser.isAdmin();
      data.timeDiff = authenticatedUser.timezoneDifference(this.model);

      return data;
    }
  });
});
