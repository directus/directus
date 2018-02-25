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
      var model = this.model;
      var data = model.toJSON();
      var authenticatedUser = app.user;
      var timeDiff = authenticatedUser.timezoneDifference(model);
      var canEdit = model.canEdit();

      data.online = model.isOnline();
      data.lastSeen = model.lastSeen();
      data.canEditUser = canEdit;
      data.timeDiff = (timeDiff > 0) ? '+' + timeDiff : timeDiff;
      data.validTimeDiff = timeDiff !== null;

      return data;
    }
  });
});
