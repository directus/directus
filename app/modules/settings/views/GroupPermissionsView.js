//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'core/BasePageView',
  'modules/tables/views/EditView',
  'core/widgets/widgets',
  'core/t',
  'schema/TableModel'
],

function(app, Backbone, _, Handlebars, BasePageView, EditView, Widgets, __t, TableModel) {

  'use strict';

  var GroupPermissions = {};

  GroupPermissions.Collection = Backbone.Collection.extend({

    parse: function(result) {
      return result.data;
    }
  });

  GroupPermissions.EditPage = EditView.extend({
    getHeaderOptions: function() {
      var options = EditView.prototype.getHeaderOptions.apply(this, arguments);

      return _.extend(options, {
        route: {
          breadcrumbs: [
            {title: __t('settings'), anchor: '#settings'},
            {title: __t('group_permissions'), anchor: '#settings/permissions'}
          ]
        },
        basicSave: true
      });
    },

    rightPane: false
  });

  return GroupPermissions;
});
