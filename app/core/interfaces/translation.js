//  Translation core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

  var Component = UIComponent.extend({
    id: 'translation',
    dataTypes: ['ONETOMANY'],
    variables: [
      {id: 'languages_table', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('translation_languages_table_comment')},
      {id: 'languages_name_column', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('translation_languages_name_column_comment')},
      {id: 'languages_code_column', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('translation_languages_code_column_comment')},
      {id: 'default_language_id', type: 'Number', ui: 'numeric', comment: __t('translation_default_language_id_comment')},
      {id: 'left_column_name', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('translation_left_column_name_comment')},
    ],
    Input: UIView
  });

  return Component;
});
