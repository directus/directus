define([
  'app',
  'core/UIView'
], function (app, UIView) {

  'use strict';

  return UIView.extend({
    template: 'user/interface',

    unsavedChange: function () {
      if (this.model.isNew()) {
        return this.userId;
      }
    },

    serialize: function () {
      var value = this.userId;
      var user = app.users.get(value);

      return {
        name: this.name,
        user: user.toJSON(),
        avatarUrl: user.getAvatar(),
        value: value
      };
    },

    initialize: function (options) {
      var userId = options.value;

      if (userId === undefined) {
        userId = app.user.id;
      }

      this.userId = userId;
    }
  });
});
