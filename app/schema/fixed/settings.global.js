define(function(require, exports, module) {

  "use strict";

  var settingsGlobalSchema = module.exports;
  var __t = require('core/t');

  settingsGlobalSchema.structure = [
      {id: 'project_name', ui: 'textinput', char_length: 50, options: {placeholder_text: __t('global_settings_project_name_placeholder')}, comment: __t('global_settings_project_name_comment')},
      {id: 'project_url', ui: 'textinput', char_length: 255, options: {placeholder_text: "http://"}, comment: __t('global_settings_project_url_comment')},
      {id: 'cms_thumbnail_url', ui: 'textinput', char_length: 255, options: {placeholder_text: "http://"}, comment: __t('global_settings_cms_thumbnail_url_comment')},
      {id: 'cms_user_auto_sign_out', ui: 'numeric', char_length: 4, options: {size: 'small'}, comment: __t('global_settings_cms_user_auto_sign_out_comment')},
      {id: 'rows_per_page', ui: 'numeric', char_length: 4, options: {size: 'small'}, comment: __t('global_settings_rows_per_page_comment')}
  ];

  return settingsGlobalSchema;
});
