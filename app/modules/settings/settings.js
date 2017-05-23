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
  'modules/settings/views/modals/columns/column',
  'modules/settings/views/modals/columns/options',
  'modules/settings/views/modals/columns/info',
  'modules/settings/views/TablesView',
  'modules/settings/views/GlobalSettingsView',
  'modules/settings/views/AboutView',
  'modules/settings/views/PermissionsView',
  'modules/settings/views/SystemView',
  'modules/settings/views/GroupPermissionsView',
  'core/t',
],

function(app, Backbone, Directus, BasePageView, ColumnView, ColumnOptionsView, ColumnInfoView, Tables, Global, About, Permissions, System, GroupPermissions, __t) {

  'use strict';

  var Settings = app.module();

  Settings.Global = Global;
  Settings.System = System;

  Settings.Table = Tables.Views.Table;
  Settings.Tables = Tables.Views.List;

  Settings.Columns = {
    View: ColumnView,
    Options: ColumnOptionsView,
    Info: ColumnInfoView
  };

  Settings.Permissions = Permissions;
  Settings.GroupPermissions = GroupPermissions;

  Settings.About = About;

  Settings.Main = BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('settings')
      },
      className: 'header settings'
    },

    // NOTE: temporary until we make the view wrap in #content
    viewOptions: {
      className: 'page settings-container'
    },

    afterRender: function () {
      // ----------------------------------------------------------------------------
      // Marketplace animation
      // ----------------------------------------------------------------------------
      var $marketplace = this.$('.marketplace');

      this.$('.float').on('animationend webkitAnimationEnd', function () {
        if ($marketplace.hasClass('hover')) {
          $(this).removeClass('animate').animate({'nothing':null}, 1, function () {
            $(this).addClass('animate');
          });
        } else {
          $(this).removeClass('animate');
        }
      });

      $marketplace.mouseenter(function () {
        $(this).find('.float').addClass('animate');
        $(this).addClass('hover');
      });

      $('.marketplace').mouseleave(function () {
        $(this).removeClass('hover');
      });
    },

    template: 'modules/settings/settings'
  });

  return Settings;
});
