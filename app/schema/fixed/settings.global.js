define(function(require, exports, module) {

  "use strict";

  var settingsGlobalSchema = module.exports;

  settingsGlobalSchema.structure = [
      {id: 'project_name', ui: 'textinput', char_length: 50, options: {placeholder_text: "My Project"}, comment: "The name of your project appears in the browser title"},
      {id: 'project_url', ui: 'textinput', char_length: 255, options: {placeholder_text: "http://"}, comment: "Clicking the main logo takes you to this URL"},
      // {id: 'cms_color', ui: 'color', comment: "Deprecated"},
      {id: 'cms_user_auto_sign_out', ui: 'numeric', char_length: 4, options: {size: 'small'}, comment: "Number of minutes before a user is automatically logged out of Directus"},
      {id: 'rows_per_page', ui: 'numeric', char_length: 4, options: {size: 'small'}, comment: "The number of items per listing page"},
      {id: 'cms_thumbnail_url', ui: 'textinput', char_length: 255, options: {placeholder_text: "http://"}, comment: "Add a image URL for the main logo (170x100)"}
  ];

  return settingsGlobalSchema;
});