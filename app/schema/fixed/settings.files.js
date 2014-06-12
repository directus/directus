define(function(require, exports, module) {

  "use strict";

  var SettingsFilesSchema = module.exports;

  SettingsFilesSchema.structure = [
    {id: 'file_file_naming', ui: 'select', char_length: 255, options: {allow_null: false, options: '{ \
        "file_name":"File Name", \
        "file_id":"Files ID" \
      }'}
    },
    {id: 'file_title_naming', ui: 'select', char_length: 255, options: {allow_null: false, options: '{ \
        "file_name":"File Name", \
        "file_id":"Files ID" \
      }'}
    },
    {id: 'allowed_thumbnails', ui: 'textinput', char_length: 255},
    {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {options: 'small'}},
    {id: 'thumbnail_crop_enabled', ui: 'checkbox'}
  ];

  return SettingsFilesSchema;
});