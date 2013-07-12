//  settings.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/ui',
  'core/directus',
  'modules/settings/tables',
  'modules/settings/global',
  'modules/settings/about',
  'modules/settings/permissions',
  'modules/settings/system',
  'modules/settings/grouppermissions'
],

function(app, Backbone, ui, Directus, Tables, Global, About, Permissions, System, GroupPermissions) {

  var Settings = app.module();

  Settings.GlobalStructure = new Directus.CollectionColumns([
    {id: 'site_name', ui: 'textinput', char_length: 255},
    {id: 'site_url', ui: 'textinput', char_length: 255},
    {id: 'cms_color', ui: 'textinput' /*, options: { options: [{title: 'Green', value: 'green'}]}*/},
    {id: 'cms_user_auto_sign_out', ui: 'numeric', char_length: 255, options: {size: 'small'}}
  ], {parse: true});

  Settings.MediaStructure = new Directus.CollectionColumns([
    {id: 'media_naming', ui: 'textinput', char_length: 255 /*, options:{ options: [{title: 'Original', value: 'original'}, {title: 'Unique', value: 'unique'}] }*/},
    {id: 'allowed_thumbnails', ui: 'textinput', char_length: 255},
    {id: 'thumbnail_quality', ui: 'numeric', char_length: 255, options: {size: 'small'}}
  ], {parse: true});

  Settings.Global = Global;
  Settings.System = System;

  Settings.Table = Tables.Views.Table;
  Settings.Tables = Tables.Views.List;

  Settings.Permissions = Permissions;
  Settings.GroupPermissions = GroupPermissions;

  Settings.About = About;

  Settings.Main = Backbone.Layout.extend({
    template: 'settings'
  });

  return Settings;
});