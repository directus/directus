define(['app', 'core/UIView'], function (app, UIView) {
  return UIView.extend({
    tagName: 'fieldset',
    initialize: function (options) {
      var user = app.users.get(options.value);
      if (user) {
        var avatar = user.getAvatar();
        this.$el.append('<img src="' + avatar + '" class="avatar" />');
      }
    }
  });
});
