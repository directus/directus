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

  var Groups =  Backbone.Layout.extend({
    template: 'modules/settings/settings-groups',

    events: {
      'click button[data-action=new-group]': 'newGroup',
      'click td': function(e) {
        var groupName = e.target.getAttribute('data-id');
        // Don't bypass Admins until their permissions are always guaranteed
        // if(groupName == 1) {
        //   return;
        // }
        app.router.go(['settings' ,'permissions', groupName]);
      }
    },

    newGroup: function(e) {
      console.log('@TODO: Create new group');
      // var collection = this.collection;
      // //@todo: link real col
      // var model = new ColumnModel({'data_type':'ALIAS','ui':{}}, {collection: this.collection});
      // var view = new NewColumnOverlay({model: model, collection: collection});
      // app.router.overlayPage(view);
    },

    serialize: function() {
      return {rows: this.collection.toJSON()};
    }

  });

  var Permissions = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Permissions',
        breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
      },
    },
    beforeRender: function() {
      this.setView('#page-content', new Groups({collection: this.collection}));
      BasePageView.prototype.beforeRender.call(this);
    },
    afterRender: function() {
      // Don't bypass Admins until their permissions are always guaranteed
      // this.$el.find('td[data-id=1]').addClass('disabled');
    }
  });

  return Permissions;
});