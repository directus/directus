define(function(require, exports, module) {

  "use strict";

  var SettingsMediaSchema = module.exports;

  SettingsMediaSchema.structure = [
    {id: 'media_naming', ui: 'textinput', char_length: 255},
    {id: 'allowed_thumbnails', ui: 'textinput', char_length: 255},
    {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {size: 'small'}},
    {id: 'thumbnail_crop_enabled', ui: 'checkbox'}
  ];

  return SettingsMediaSchema;
});