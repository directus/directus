define([
  "app",
  "backbone",
  'handlebars',
  "core/directus",
  'core/BasePageView',
  'core/widgets/widgets',
  'core/t',
  'moment'
],

function(app, Backbone, Handlebars, Directus, BasePageView, Widgets, __t, moment) {

  'use strict';

  var BodyView = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      class: 'user-listing'
    },

    template: 'modules/users/card-view',

    events: {
      // old selector: .header-image, .primary-info
      'click .user': function(e) {
        var id = $(e.target).closest('.user').data('id');
        var user = app.users.getCurrentUser();
        var userGroup = user.get('group');

        //@todo fix this so it respects ACL instead of being hardcoded
        if (!(parseInt(id,10) === user.id || userGroup.id === 1)) {
          return;
        }

        app.router.go('#users', id);
      }
    },

    serialize: function() {
      var rows = this.collection.map(function (model) {
        var data = {
          id: model.get('id'),
          cid: model.cid,
          avatar: model.getAvatar(),
          avatar_file_id: model.get('avatar_file_id'),
          first_name: model.get('first_name'),
          last_name: model.get('last_name'),
          email: model.get('email'),
          position: model.get('position'),
          location: model.get('location'),
          phone: model.get('phone'),
          online: model.isOnline(),
          group_id: model.get('group').id,
          group_name: model.get('group').get('name'),
          inactive: false
        };

        // Put non-active users into the Inactive Group.
        var hasStatusColumn = model.has(app.statusMapping.status_name);
        var statusValue = model.get(app.statusMapping.status_name);
        if (hasStatusColumn && statusValue !== app.statusMapping.active_num) {
          data.group_id = 0;
          data.group_name = 'Inactive';
          data.inactive = true;
        }

        var avatarSmall = model.getAvatar();

        data.avatar = new Handlebars.SafeString('<img src="' + avatarSmall + '" style="width:200px;height:200px"/>');

        return data;
      });

      rows = _(rows).sortBy('first_name');

      var groupedData = [];

      rows.forEach(function(group) {
        if (!groupedData['group_' + group.group_id]) {
          groupedData['group_' + group.group_id] = {title: group.group_name, rows: []};
        }

        groupedData['group_' + group.group_id].rows.push(group);
      });

      var data = [];

      for(var group in groupedData) {
        // skip inactive group
        // and push it at the end
        if (group !== 'group_0') {
          data.push(groupedData[group]);
        }
      }

      // if exists, push inactive users group at the end
      if (_.has(groupedData, 'group_0')) {
        data.push(groupedData['group_0']);
      }

      return {groups: data};
    },

    initialize: function(options) {
      this.collection.on('sort', this.render, this);
      this.listenTo(this.collection, 'sync', function(model, resp, options) {
        if (options.silent) return;
        this.render();
      });
    }
  });

  var View = BasePageView.extend({

    headerOptions: {
      route: {
        title: __t('users'),
      }
    },
    leftToolbar: function() {
      if(app.users.getCurrentUser().get('group').id === 1) {
        return [
          new Widgets.ButtonWidget({
            widgetOptions: {
              buttonId: 'addBtn',
              iconClass: 'add',
              buttonClass: 'primary',
              buttonText: __t('new_user')
            },
            onClick: function () {
              app.router.go('#users', 'new');
            }
          })
        ];
      }
      return [];
    },

    leftSecondaryToolbar: function() {
      if (!this.widgets.visibilityWidget) {
        this.widgets.visibilityWidget = new Widgets.VisibilityWidget({collection: this.collection, basePage: this});
      }

      if (!this.widgets.filterWidget) {
        this.widgets.filterWidget = new Widgets.FilterWidget({collection: this.collection, basePage: this});
      }

      return [this.widgets.visibilityWidget, this.widgets.filterWidget];
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      var status = this.collection.preferences.get('status');
      // Ignore preferences and get all users
      // @todo: make a better solution
      this.collection.preferences.unset('status');
      this.collection.filters['status'] = '0,1,2';
      this.collection.fetch();
      this.collection.preferences.set('status', status);
    },

    initialize: function() {
      this.viewList = false;
      this.table = new BodyView({collection:this.collection});
      this.widgets = [];
    }
  });


  return View;

});
