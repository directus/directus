//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/directus'
],

function(app, Directus) {

  var Permissions = Backbone.Layout.extend({

    template: 'settings-grouppermissions',

  });

  var GroupPermissions = Backbone.Layout.extend({
    template: 'page',
    serialize: {
      title: 'XXX',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Permissions', anchor: '#settings/permissions'}]
    },
    beforeRender: function() {
      this.setView('#page-content', new Permissions({collection: this.collection}));
    }
  });

  return GroupPermissions;
});