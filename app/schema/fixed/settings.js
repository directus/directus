define(function(require, exports, module) {

  'use strict';

  // TODO: Change "settings_" to "directus_settings_" on locales files.
  var __t = require('core/t');
  var trans = function (key) {
    return __t('directus_settings_' + key);
  };

  var transComments = function (key) {
    return __t('directus_settings_' + key + '_comment');
  };

  var settingsGlobalSchema = {
    "id":"directus_settings",
    "table_name":"directus_settings",
    "hidden":true,
    "single":false,
    "count":0,
    "url": "api/1.1/settings"
  };

  var settingsFilesSchema = {
    "id":"directus_settings",
    "table_name":"directus_settings",
    "hidden":true,
    "single":false,
    "count":0,
    "url": "api/1.1/settings"
  };

  settingsGlobalSchema.columns = [
    {
      id: 'project_name',
      ui: 'text_input',
      char_length: 50,
      options: {
        placeholder: trans('global_project_name_placeholder')
      },
      comment: transComments('global_project_name')
    },
    {
      id: 'project_url',
      ui: 'text_input',
      char_length: 255,
      options: {
        placeholder: "http://"
      },
      comment: transComments('global_project_url')
    },
    {
      id: 'cms_thumbnail_url',
      ui: 'single_file',
      options: {
        id: 'single_file',
        'allowed_filetypes': 'image\/*'
      },
      'relationship_type': 'MANYTOONE',
      'related_table': 'directus_files',
      'junction_key_right': 'cms_thumbnail_url',
      comment: transComments('global_cms_thumbnail_url')
    },
    {
      id: 'cms_user_auto_sign_out',
      ui: 'numeric',
      char_length: 4,
      options: {
        size: 'small'
      },
      comment: transComments('global_cms_user_auto_sign_out')
    },
    {
      id: 'rows_per_page',
      ui: 'numeric',
      char_length: 4,
      options: {
        size: 'small'
      },
      comment: transComments('global_rows_per_page')
    }
  ];

  settingsFilesSchema.columns = [
    {
      id: 'file_naming',
      ui: 'dropdown',
      char_length: 255,
      options: {
        allow_null: false,
        options: '{ \
          "file_name":"' + trans('files_file_naming_file_name') + '", \
          "file_id":"' + trans('files_file_naming_file_id') + '", \
          "file_hash":"' + trans('files_file_naming_file_hash') + '" \
        }'
      },
      comment: transComments('files_file_naming')
    },
    {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {size: 'small', placeholder: "eg: 90"}, comment: __t('directus_settings_files_thumbnail_quality_comment')},
    {id: 'thumbnail_crop_enabled', ui: 'toggle', comment: __t('directus_settings_files_thumbnail_crop_enabled')},
    {id: 'youtube_api_key', ui: 'text_input', char_length: 255, comment: __t('directus_settings_files_youtube_api_key_comment')}
  ];

  module.exports = {
    global: settingsGlobalSchema,
    files: settingsFilesSchema
  };
});
