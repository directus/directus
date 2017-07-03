define([
  'app',
  'core/UIView'
], function (app, UIView) {

  'use strict';

  return UIView.extend({
    template: 'user/interface',

    serialize: function () {
      var value = this.options.value;
      var user;

      if (value === undefined) {
        value = app.users.getCurrentUser().id;
      }

      this.model.set(this.name, value);
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
