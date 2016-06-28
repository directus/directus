//  settings.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView',
  'modules/settings/views/TablesView',
  'modules/settings/views/GlobalSettingsView',
  'modules/settings/views/AboutView',
  'modules/settings/views/PermissionsView',
  'modules/settings/views/SystemView',
  'modules/settings/views/GroupPermissionsView',
  'core/t',
],

function(app, Backbone, Directus, BasePageView, Tables, Global, About, Permissions, System, GroupPermissions, __t) {

  "use strict";

  var Settings = app.module();

  Settings.Global = Global;
  Settings.System = System;

  Settings.Table = Tables.Views.Table;
  Settings.Tables = Tables.Views.List;

  Settings.Permissions = Permissions;
  Settings.GroupPermissions = GroupPermissions;

  Settings.About = About;

  Settings.Main = BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('settings')
      },
    },
    template: 'modules/settings/settings'
  });

  return Settings;
});
