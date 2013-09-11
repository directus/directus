//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

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
      case 'short':
      default:      
        html = '{{userShort user}}';
        break;
    }

    var template = Handlebars.compile(html);
    return template({user: parseInt(options.value,10)});
  };

  Module.Input = Backbone.Layout.extend({
    tagName: 'fieldset',
    initialize: function(options) {
      var user = app.users.get(options.value);
      if(user) {
        this.$el.html('<label>'+app.capitalize(this.options.name)+'</label>');
        this.$el.append('<img src="' + user.get('avatar') + '" style="margin-right:10px;" class="avatar">' + user.get('first_name') + ' ' + user.get('last_name'));        
      }
    }
  });

  return Module;
});