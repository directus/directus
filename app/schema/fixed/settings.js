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
      ui: 'textinput',
      char_length: 50,
      options: {
        placeholder_text: trans('global_project_name_placeholder')
      },
      comment: transComments('global_project_name')
    },
    {
      id: 'project_url',
      ui: 'textinput',
      char_length: 255,
      options: {
        placeholder_text: "http://"
      },
      comment: transComments('global_project_url')
    },
    {
      id: 'cms_thumbnail_url',
      ui: 'textinput',
      char_length: 255,
      options: {
        placeholder_text: "http://"
      },
      comment: transComments('global_cms_thumbnail_url')
    },
    {
      id: 'cms_user_auto_sign_out',
      ui: 'numeric',
      char_length: 4,
      options: {
        size: 'small'
      },
      comment: __t('global_settings_cms_user_auto_sign_out_comment')
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
      ui: 'select',
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
    {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {size: 'small', placeholder_text: "eg: 90"}, comment: __t('settings_files_thumbnail_quality_comment')},
    {id: 'thumbnail_crop_enabled', ui: 'checkbox', comment: __t('settings_files_thumbnail_crop_enabled')},
    {id: 'youtube_api_key', ui: 'textinput', char_length: 255, comment: __t('settings_files_youtube_api_key_comment')+'<br><a target="_blank" href="https://developers.google.com/youtube/v3/getting-started">'+__t('settings_files_youtube_api_key_get_key')+'</a>'}
  ];

  module.exports = {
    global: settingsGlobalSchema,
    files: settingsFilesSchema
  };
});
