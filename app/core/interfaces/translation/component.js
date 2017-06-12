//  Translation core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['core/UIComponent', 'core/UIView', 'core/t'], function (UIComponent, UIView, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'translation',
    dataTypes: ['ONETOMANY'],
    variables: [
      {id: 'languages_table', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('translation_languages_table_comment'), required: true},
      {id: 'languages_name_column', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('translation_languages_name_column_comment'), required: true},
      {id: 'languages_code_column', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('translation_languages_code_column_comment'), required: true},
      {id: 'default_language_id', type: 'Number', ui: 'numeric', comment: __t('translation_default_language_id_comment'), required: true},
      {id: 'left_column_name', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('translation_left_column_name_comment'), required: true}
    ],
    Input: UIView
  });
});
