define(function(require, exports, module) {

  "use strict";

  var SettingsMediaSchema = module.exports;

  SettingsMediaSchema.structure = [
    {id: 'media_naming', ui: 'select', char_length: 255, options: {allow_null: false, options: '{ \
        "file_name":"File Name", \
        "media_id":"Media ID" \
      }'}
    },
    {id: 'allowed_thumbnails', ui: 'textinput', char_length: 255},
    {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {options: 'small'}},
    {id: 'thumbnail_crop_enabled', ui: 'checkbox'}
  ];

  return SettingsMediaSchema;
});