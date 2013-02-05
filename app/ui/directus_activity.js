//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'directus_activity';
  Module.system = true;

  Module.list = function(options) {
    return '<a href="#tables/' + options.model.get('table') + '/' + options.model.get('row') + '">Item ' + options.model.get('row') + ' </a> has been ' + options.model.get('type') + ' ' + {added: 'to', deleted:'from', edited:'within', activated:'within'}[options.model.get('type')] + ' <a href="#tables/' + options.model.get('table') + '">' + options.model.get('table') + '</a>';
  };

  return Module;
});