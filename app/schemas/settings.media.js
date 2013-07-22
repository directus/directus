define([], function() {
  var SettingsMediaSchema = {};

  SettingsMediaSchema.structure = [
    {id: 'media_naming', ui: 'textinput', char_length: 255 /*, options:{ options: [{title: 'Original', value: 'original'}, {title: 'Unique', value: 'unique'}] }*/},
    {id: 'allowed_thumbnails', ui: 'textinput', char_length: 255},
    {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {size: 'small'}}
  ];

  return SettingsMediaSchema;
});