//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {

  'use strict';

  var Input = UIView.extend({
    tagName: 'fieldset',
    initialize: function(options) {
      var user = app.users.get(options.value);
      if(user) {
        var avatar = user.getAvatar();
        this.$el.append('<img src="'+avatar+'" class="avatar" />');
      }
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_user_avatar',
    system: true,
    sortBy: ['email'],
    Input: Input,
    list: function(options) {
      var html = '{{userAvatar user}}';

      return this.compileView(html, {user: parseInt(options.model.id,10)});
    }
  });

  return new Component();
});
