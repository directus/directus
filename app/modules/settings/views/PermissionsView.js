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
      'click button[data-action=new-group]': 'newGroup'
    },

    newGroup: function(e) {
      // @TODO either move this to permission or from permission to here
      //
      // console.log('@TODO: Create new group');
      // var collection = this.collection;
      // //@todo: link real col
      // var model = new ColumnModel({'data_type':'ALIAS','ui':{}}, {collection: this.collection});
      // var view = new NewColumnOverlay({model: model, collection: collection});
      // app.router.overlayPage(view);
    },

    serialize: function() {
      return {rows: this.collection.toJSON()};
    },
    
    addRowView: function(model, render) {
      var view = this.insertView('tbody', new GroupsRow({model: model}));
      if (render !== false) {
        view.render();
      }
    },

    beforeRender: function() {
      this.collection.each(function(model){
        this.addRowView(model, false);
      }, this);
    },

    initialize: function() {
      this.listenTo(this.collection, 'add', this.addRowView);
    }

  });
  
  var GroupsRow = Backbone.Layout.extend({

    template: 'modules/settings/settings-groups-rows',

    tagName: 'tr',

    events: {
      'click td': function(e) {
        var groupName = e.target.getAttribute('data-id');
        // Don't bypass Admins until their permissions are always guaranteed
        // if(groupName == 1) {
        //   return;
        // }
        app.router.go(['settings' ,'permissions', groupName]);
      }
    },

    serialize: function() {
      return this.model.toJSON();
    }
  });

  var Permissions = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Group Permissions',
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
        app.router.openModal({type: 'prompt', text: 'What would you like to name this group?', callback: function(groupName) {
          if(groupName && !app.schemaManager.getPrivileges('directus_permission')) {
            var model = new Backbone.Model();
            model.url = app.API_URL + 'groups';
            model.set({name: groupName});
            model.save({}, {success: function(model) {
              console.log(model);
              model.fetch({success: function(){
                that.collection.add(model);
              }});
            }});
          }
        }});
      }
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