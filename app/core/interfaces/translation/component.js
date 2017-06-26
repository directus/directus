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
      {
        id: 'languages_table',
        ui: 'text_input',
        type: 'String',
        comment: __t('translation_languages_table_comment'),
        default_value: '',
        char_length: 255,
        required: true
      },
      {
        id: 'languages_name_column',
        ui: 'text_input',
        type: 'String',
        comment: __t('translation_languages_name_column_comment'),
        default_value: '',
        char_length: 255,
        required: true
      },
      {
        id: 'languages_code_column',
        ui: 'text_input',
        type: 'String',
        comment: __t('translation_languages_code_column_comment'),
        default_value: '',
        char_length: 255,
        required: false
      }, {
        id: 'default_language_id',
        ui: 'numeric',
        type: 'Number',
        comment: __t('translation_default_language_id_comment'),
        required: true
      }, {
        id: 'left_column_name',
        ui: 'text_input',
        type: 'String',
        comment: __t('translation_left_column_name_comment'),
        default_value: '',
        char_length: 255,
        required: true
      }
    ],
    Input: UIView
  });
});
