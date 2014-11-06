//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/widgets/widgets',
  'core/BasePageView'
],

function(app, Backbone, Widgets, BasePageView) {

  "use strict";

  var Groups =  Backbone.Layout.extend({
    template: 'modules/settings/settings-groups',

    events: {
      'click td': function(e) {
        var groupName = e.target.getAttribute('data-id');
        if(groupName == 1) {
          return;
        }
        app.router.go(['settings' ,'permissions', groupName]);
      }
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
    leftToolbar: function() {
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-plus", buttonClass: "add-color-background"}})
      ];
    },
    events: {
      'click #addBtn': function() {
        var that = this;
        app.router.openModal({type: 'prompt', text: 'Please Enter the name of the Group you would like to add.', callback: function(groupName) {
          if(groupName && !app.schemaManager.getPrivileges('directus_permission')) {
            var model = new Backbone.Model();
            model.url = app.API_URL + 'groups';
            model.set({name: groupName});
            model.save();
            // @TODO render just once, instead of reload
            that.listenToOnce(model, 'sync', function() {
              location.reload();
            });
          }
        }});
      }
    },
    beforeRender: function() {
      this.setView('#page-content', new Groups({collection: this.collection}));
      BasePageView.prototype.beforeRender.call(this);
    },
    afterRender: function() {
      this.$el.find('td[data-id=1]').addClass('disabled');
    }
  });

  return Permissions;
});
