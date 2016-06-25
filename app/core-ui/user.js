//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

  var Input = UIView.extend({
    initialize: function(options) {
      // If editing a new item, use the current user
      if(options.model.isNew()){
        options.value = app.authenticatedUserId;
      }

      var user = app.users.get(options.value);

      if(user) {
        var avatar = user.getAvatar();
        this.$el.append('<img src="' + avatar + '" class="big-avatar"><span class="big-avatar-name">' + user.get('first_name') + ' ' + user.get('last_name') + '</span>');
      } else {
        this.$el.append('<span class="avatar-name medium-grey-color">'+__t('no_user')+'</span>');
      }
    }
  });

  var Component = UIComponent.extend({
    id: 'user',
    dataTypes: ['INT'],
    variables: [
      // {id: 'readonly', ui: 'checkbox', def: '1'},
      // {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }},
      // {id: 'mirrored_field', ui: 'textinput', char_length:200}
    ],
    Input: Input,
    list: function(options) {
      var avatar, output, user = app.users.get(options.value);

      if(user) {
        avatar = user.getAvatar();
        output = '<img src="' + avatar + '" class="avatar"><span class="avatar-name">' + user.get('first_name') + ' ' + user.get('last_name') + '</span>';
      } else {
        output = '<span class="avatar-name medium-grey-color">'+__t('no_user')+'</span>';
      }

      return output;
    }
  });

  return Component;
});
