define(function(require, exports, module) {

  "use strict";

  var SettingsFilesSchema = module.exports;
  var __t = require('core/t');

  SettingsFilesSchema.structure = [
    {id: 'file_naming', ui: 'select', char_length: 255, options: {allow_null: false, options: '{ \
        "file_name":"'+__t('settings_files_file_naming_file_name')+'", \
        "file_id":"'+__t('settings_files_file_naming_file_id')+'", \
        "file_hash":"'+__t('settings_files_file_naming_file_hash')+'" \
      }'}, comment: __t('settings_files_file_naming_comment')
    },
    {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {size: 'small', placeholder_text: "eg: 90"}, comment: __t('settings_files_thumbnail_quality_comment')},
    {id: 'thumbnail_crop_enabled', ui: 'checkbox', comment: __t('settings_files_thumbnail_crop_enabled')},
    {id: 'youtube_api_key', ui: 'textinput', char_length: 255, comment: __t('settings_files_youtube_api_key_comment')+'<br><a target="_blank" href="https://developers.google.com/youtube/v3/getting-started">'+__t('settings_files_youtube_api_key_get_key')+'</a>'}
  ];

  return SettingsFilesSchema;
});
