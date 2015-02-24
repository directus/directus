//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'directus_user';
  Module.system = true;
  Module.sortBy = ['first_name','last_name'];

  Module.list = function(options) {
    var html;
    switch(options.settings.get("format")) {
      case 'full':
        html = '{{userFull user}}';
        break;
      default:
        html = '{{userShort user}}';
        break;
    }

    var template = Handlebars.compile(html);
    return template({user: parseInt(options.value,10)});
  };

  Module.Input = Backbone.Layout.extend({
    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    initialize: function(options) {
      var user = app.users.get(options.value);
      if(user) {
        var avatar = user.getAvatar();
        this.$el.append('<img src="' + avatar + '" class="avatar"><span class="avatar-name">' + user.get('first_name') + ' ' + user.get('last_name') + '</span>');
      }
    }
  });

  return Module;
});