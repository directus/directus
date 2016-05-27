//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','core/UIView'], function(app, UIView) {

  'use strict';

  var Module = {};

  Module.id = 'directus_user_avatar';
  Module.system = true;
  Module.sortBy = ['email'];

  Module.list = function(options) {
    var html = '{{userAvatar user}}';
    var template = Handlebars.compile(html);
    return template({user: parseInt(options.model.id,10)});
  };

  Module.Input = UIView.extend({
    tagName: 'fieldset',
    initialize: function(options) {
      var user = app.users.get(options.value);
      if(user) {
        var avatar = user.getAvatar();
        this.$el.append('<img src="'+avatar+'" class="avatar" />');
      }
    }
  });

  return Module;
});
