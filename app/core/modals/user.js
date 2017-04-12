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
      var timeDiff = authenticatedUser.timezoneDifference(this.model);

      data.online = this.model.isOnline();
      data.lastSeen = this.model.lastSeen();
      data.canEditUser = authenticatedUser.isAdmin() && this.model.id;
      data.timeDiff = (timeDiff > 0)? "+" + timeDiff : timeDiff;
      data.validTimeDiff = timeDiff !== null;

      return data;
    }
  });
});
