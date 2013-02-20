//  Directus User Activity List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  var Module = {};
  Module.id = 'directus_user_activity';
  Module.system = true;
  Module.sortBy = 'last_login';

  Module.list = function(options) {
    //return '<a href="#activity">Activity page ' + app.contextualDate(options.model.get('last_login')) + '</a>';
    return '<a href="#activity" title="'+options.model.get('last_login')+'">Activity page ' + jQuery.timeago(options.model.get('last_login')) + '</a>';
  };

  return Module;
});