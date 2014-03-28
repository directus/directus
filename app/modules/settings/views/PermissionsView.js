//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/BasePageView'
],

function(app, Backbone, BasePageView) {

  "use strict";

  var Groups = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Settings'
      },
    },

    template: 'modules/settings/settings-groups',

    events: {
      'click td': function(e) {
        var groupName = e.target.getAttribute('data-id');
        app.router.go(['settings' ,'permissions', groupName]);
      }
    },

    serialize: function() {
      return {rows: this.collection.toJSON()};
    }

  });

  var Permissions = Backbone.Layout.extend({
    template: 'page',
    serialize: {
      title: 'Permissions',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
    },
    beforeRender: function() {
      this.setView('#page-content', new Groups({collection: this.collection}));
    }
  });

  return Permissions;
});