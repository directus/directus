//  Directus User List View component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','backbone'], function(app, Backbone) {

  'use strict';

  var Module = {};

  Module.id = 'directus_activity';
  Module.system = true;


  Module.Input = Backbone.Layout.extend({
  });

  Module.list = function(options) {
    var model = options.model;
    var action = model.get('action');
    var table = model.get('table_name');
    var type = model.get('type');
    var returnStr;

    var identifier = model.get('identifier');
    if(null === identifier)
      identifier = "Entry #" + model.get('row_id');

    switch (type) {
      case 'FILES':
        returnStr = '<a href="#" data-action="files" data-id="'+model.get('row_id')+'">' + identifier + '</a> has been ' + app.actionMap[action] + ' ' + app.prepositionMap[action] + ' <a href="#files">Files</a>';
        break;
      case 'SETTINGS':
        returnStr = 'The settings have been updated';
        break;
      case 'UI':
        returnStr = 'A UI has been updated';
        break;
      default:
        var targetObjectPath;
        if (table === 'directus_users') {
          targetObjectPath = 'users/' + model.get('row_id');
        } else {
          targetObjectPath = '#tables/' + table + '/' + model.get('row_id');
        }
        returnStr =
            '<a href="' + targetObjectPath + '">' + identifier + ' </a>'+
              ' has been ' + app.actionMap[action] + ' ' + app.prepositionMap[action] +
            ' <a href="#tables/' + table + '">' + app.capitalize(table) + '</a>';
        break;
    }

      return returnStr;
  };

  return Module;
});