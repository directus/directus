define(['./interface', 'core/UIComponent'], function (Input, UIComponent) {
  return UIComponent.extend({
    id: 'directus_user_avatar',
    system: true,
    sortBy: ['email'],
    Input: Input,
    list: function (options) {
      var html = '{{userAvatar user}}';

      return this.compileView(html, {user: parseInt(options.model.id, 10)});
    }
  });
});
