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
  	if(options.model.get('last_login') !== null){
	    return '<a href="#activity" title="'+options.model.get('last_login')+'">' + options.model.get('last_page') + ' page ' + jQuery.timeago(options.model.get('last_login')) + '</a>';
  	} else {
  		return '<a href="#">Never logged in</a>';
  	}
  };

  return Module;
});