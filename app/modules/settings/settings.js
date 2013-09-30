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

  "use strict";

  var Settings = app.module();

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