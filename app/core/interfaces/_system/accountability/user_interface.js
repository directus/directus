define([
  'app',
  'core/UIView'
], function (app, UIView) {

  'use strict';

  return UIView.extend({
    template: '_system/accountability/user',

    serialize: function () {
      var value = this.options.value;
      var user;

      if (value === undefined) {
        value = app.users.getCurrentUser().id;
      }

      user = app.users.get(value);

      return {
        name: this.name,
        user: user.toJSON(),
        avatarUrl: user.getAvatar(),
        value: value
      };
    }
  });
});
