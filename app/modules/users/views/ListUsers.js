define([
  'app',
  'underscore',
  'backbone',
  'handlebars',
  "core/directus",
  'core/BasePageView',
  'helpers/file',
  'core/widgets/widgets',
  'core/t',
  'moment'
],

function(app, _, Backbone, Handlebars, Directus, BasePageView, FileHelper, Widgets, __t, moment) {

  'use strict';

  var BodyView = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      class: 'user-listing'
    },

    template: 'modules/users/card-view',

    events: {
      'click .user': 'showUser'
    },

    showUser: function (event) {
      var id = $(event.currentTarget).data('id');
      var user = app.user;
      var userGroup = user.get('group');

      // @TODO: fix this so it respects ACL instead of being hardcoded
      // if (!(parseInt(id,10) === user.id || userGroup.id === 1)) {
      //   return;
      // }

      app.router.openUserModal(id);
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
        var hasStatusColumn = model.table.hasStatusColumn();
        var statusColumnName = model.table.getStatusColumnName();
        var statusValue = model.get(statusColumnName);

        if (hasStatusColumn && statusValue != model.table.getStatusDefaultValue()) {
          data.group_id = 0;
          data.group_name = 'Inactive';
          data.inactive = true;
        }

        data.avatarUrl = model.getAvatar();

        return data;
      });

      rows = _(rows).sortBy('first_name');

      var groupedData = [];

      rows.forEach(function (group) {
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

      return {
        empty: rows.length <= 0,
        groups: data
      };
    },

    afterRender: function () {
      FileHelper.onImageError(this.$('.js-image img'), function () {
        var $el = $(this);

        $el.attr('data-src', $el.attr('src'));
        $el.attr('src', app.PATH + 'assets/imgs/missing-user.svg');
      });
    },

    initialize: function (options) {
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

    attributes: {
      class: 'page-container'
    },

    rightToolbar: function () {
      return [
        new Widgets.FilterWidget({
          collection: this.collection,
          basePage: this
        })
      ];
    },

    leftToolbar: function() {
      var widgets = [];

      if (app.user.get('group').id === 1) {
        widgets.push(new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'add',
            buttonClass: 'primary',
            buttonText: __t('new_user')
          },
          onClick: function () {
            app.router.go('#users', 'new');
          }
        }));
      }

      widgets.push(new Widgets.InfoButtonWidget({enable: false}));
      widgets.push(new Widgets.FilterButtonWidget);

      return widgets;
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      var status = this.collection.preferences.get('status');

      this.collection.fetch();
      this.collection.preferences.set('status', status);
    },

    initialize: function() {
      this.viewList = false;
      this.widgets = [];
      this.table = new BodyView({
        collection: this.collection
      });
    }
  });


  return View;

});
