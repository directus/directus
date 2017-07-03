define([
  'app',
  'core/UIView'
], function (app, UIView) {

  'use strict';

  return UIView.extend({
    template: 'user/interface',

    beforeSaving: function () {
      return this.userId;
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
        userId = app.users.getCurrentUser().id;
      }

      this.userId = userId;
    }
  });
});
