//  Translation core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app','core/UIView'], function(app, UIView) {

  'use strict';

  var Module = {};

  Module.id = 'translation';
  Module.dataTypes = ['ONETOMANY'];

  Module.variables = [
    {id: 'languages_table', ui: 'textinput', char_length: 255, comment: "Enter Table that contains all languages supported"},
    {id: 'languages_name_column', ui: 'textinput', char_length: 255, comment: "Language Title Field"},
    {id: 'default_language_id', ui: 'numeric', comment: "Default language ID in language table"},
    {id: 'left_column_name', ui: 'textinput', char_length: 255, comment: "Enter Column name pointing to Languages table PK"},
  ];

  Module.Input = UIView.extend({

  });

  return Module;
});
