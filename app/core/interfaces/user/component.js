define([
  'app',
  'core/UIComponent',
  './interface'
], function (app, UIComponent, Input) {

  'use strict';

  return UIComponent.extend({
    id: 'directus_user',
    system: true,
    sortBy: ['first_name', 'last_name'],
    Input: Input,
    dataTypes: ['INT'],
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
    },

    sort: function (options) {
      var userId = options.value || options.model.id;
      var userModel = app.users.get(userId);

      return userModel.getFullName();
    }
  });
});
