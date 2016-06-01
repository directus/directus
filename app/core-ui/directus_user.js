//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {

  'use strict';

  var Input = UIView.extend({
    initialize: function(options) {
      var user = app.users.get(options.value);
      if(user) {
        var avatar = user.getAvatar();
        this.$el.append('<img src="' + avatar + '" class="avatar"><span class="avatar-name">' + user.get('first_name') + ' ' + user.get('last_name') + '</span>');
      }
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_user',
    system: true,
    sortBy: ['first_name','last_name'],
    Input: Input,
    list: function(options) {
      var html;

      switch(options.settings.get('format')) {
        case 'full':
          html = '{{userFull user}}';
          break;
        default:
          html = '{{userShort user}}';
          break;
      }

      return this.compileView(html, {user: parseInt(options.value,10)});
    }
  });

  return new Component();
});
