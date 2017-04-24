//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'underscore',
  'backbone',
  'core/widgets/widgets',
  'core/t',
  'helpers/table',
  'modules/settings/GroupsModel',
  'core/BasePageView'
],

function(app, _, Backbone, Widgets, __t, TableHelpers, GroupsModel, BasePageView) {

  'use strict';

  var Groups = Backbone.Layout.extend({
    template: 'modules/settings/settings-groups',

    serialize: function() {
      return {rows: this.collection.toJSON()};
    },

    addRowView: function(model, render) {
      var view = this.insertView('tbody', new GroupsRow({
        model: model,
        attributes: {
          'class': model.get('name').toLowerCase() + '-group',
          'data-id': model.id
        }
      }));

      if (render !== false) {
        view.render();
      }
    },

    beforeRender: function() {
      this.collection.each(function(model){
        this.addRowView(model, false);
      }, this);
    },

    afterRender: function () {
      TableHelpers.fixWidths(this.$el);
    },

    initialize: function() {
      this.listenTo(this.collection, 'add', this.addRowView);
    }
  });

  var GroupsRow = Backbone.Layout.extend({

    template: 'modules/settings/settings-groups-rows',

    tagName: 'tr',

    events: {
      'click': 'onClick'
    },

    onClick: function (event) {
      var groupName = $(event.currentTarget).data('id');
      // Don't bypass Admins until their permissions are always guaranteed
      // if(groupName === 1) {
      //   return;
      // }
      app.router.go(['settings' ,'permissions', groupName]);
    },

    serialize: function() {
      var data = this.model.toJSON();

      if (this.model.isPublic()) {
        data.usersCount = 'n/a';
      } else {
        data.usersCount = data.users.length;
      }

      return data;
    }
  });

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('group_permissions'),
        breadcrumbs: [{title: __t('settings'), anchor: '#settings'}]
      },
      className: 'header settings'
    },

    leftToolbar: function() {
      return  [
        new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'add',
            buttonClass: 'primary',
            buttonText: __t('add_new')
          },
          onClick: _.bind(this.createNewGroup, this)
        })
      ];
    },

    createNewGroup: function () {
      var self = this;
      app.router.openModal({type: 'prompt', text: __t('what_would_you_like_to_name_this_group'), callback: function(groupName) {
        if (groupName && !app.schemaManager.getPrivileges('directus_permission')) {
          var model = new GroupsModel({name: groupName}, {
            parse: true,
            collection: self.collection
          });

          var options = {
            success: function (model) {
              self.collection.add(model);
            }
          };

          model.save({}, options);
        }
      }});
    },

    beforeRender: function() {
      this.setView('#page-content', new Groups({collection: this.collection}));
      BasePageView.prototype.beforeRender.call(this);
    }
  });
});
