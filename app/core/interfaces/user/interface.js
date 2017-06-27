define(['app', 'core/UIComponent', 'core/UIView'], function (app, UIComponent, UIView) {
  'use strict';

  var Input = UIView.extend({
    template: 'user/interface',

    serialize: function () {
      var user = app.users.get(this.options.value);
      var name = user.get('first_name') + ' ' + user.get('last_name');

      return {
        name: name,
        user: user,
        avatarUrl: user.getAvatar()
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_user',
    system: true,
    sortBy: ['first_name', 'last_name'],
    Input: Input,
    list: function (options) {
      var html;
      var userId = options.value || options.model.id;

      switch (options.settings.get('format')) {
        case 'full':
          html = '{{userFull user}}';
          break;
        default:
          html = '{{userShort user}}';
          break;
      }

      html = '<div class="interface-user">' + html + '</div>';

      return this.compileView(html, {
        user: userId
      });
    }
  });

  return Component;
});
