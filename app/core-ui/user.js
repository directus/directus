//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'user';
  Module.dataTypes = ['INT'];

  Module.variables = [
    // {id: 'readonly', ui: 'checkbox', def: '1'},
    // {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }},
    // {id: 'mirrored_field', ui: 'textinput', char_length:200}
  ];

  Module.Input = Backbone.Layout.extend({
    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    initialize: function(options) {

      // If editing a new item, use the current user
      if(options.model.isNew()){
        options.value = app.authenticatedUserId;
      }

      var user = app.users.get(options.value);

      if(user) {
        var avatar = user.getAvatar();
        this.$el.append('<img src="' + avatar + '" class="avatar"><span class="avatar-name">' + user.get('first_name') + ' ' + user.get('last_name') + '</span>');
      } else {
        this.$el.append('<span class="avatar-name medium-grey-color">No user</span>');
      }
    }
  });

  Module.list = function(options) {
    var avatar, output, user = app.users.get(options.value);

    if(user) {
      avatar = user.getAvatar();
      output = '<img src="' + avatar + '" class="avatar"><span class="avatar-name">' + user.get('first_name') + ' ' + user.get('last_name') + '</span>';
    } else {
      output = '<span class="avatar-name medium-grey-color">No user</span>';
    }
    return output;
  };

  return Module;
});