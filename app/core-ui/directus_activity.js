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
    var model = options.model;
    var action = model.get('action');
    var table = model.get('table_name');
    var type = model.get('type');
    var returnStr;

    switch (type) {
      case 'MEDIA':
        returnStr = '<a href="#" data-action="media" data-id="'+model.get('row_id')+'">' + model.get('identifier') + '</a> has been added to <a href="#media">Media</a>';
        break;
      case 'SETTINGS':
        returnStr = 'The settings have been updated';
        break;
      case 'UI':
        returnStr = 'A UI has been updated';
        break;
      default:
        returnStr =
            '<a href="#tables/' + table + '/' + model.get('row_id') + '">' + model.get('identifier') + ' </a>'+
              ' has been ' + app.actionMap[action] + ' ' + app.prepositionMap[action] +
            ' <a href="#tables/' + table + '">' + app.capitalize(table) + '</a>';
        break;
    }

      return returnStr;
  };

  return Module;
});