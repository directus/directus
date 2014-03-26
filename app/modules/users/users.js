define([
  "app",
  "backbone",
  "core/directus",
  'core/panes/pane.saveview'
],

function(app, Backbone, Directus, SaveModule) {

  "use strict";

  var Users = app.module();


  Users.Views.Edit = Backbone.Layout.extend({

    template: 'page',

    events: {
      'click #save-form': function(e) {
        var data = $('form').serializeObject();
        var model = this.model;
        data.active = $('input[name=active]:checked').val();

        //Dont include empty passwords!
        if (data.password === "") {
          delete data.password;
        }

        var diff = model.diff(data);

        var options = {
          success: function() { app.router.go('#users'); },
          error: function() { console.log('error',arguments); },
          patch: true,
          includeRelationships: true
        };

        // @todo, fix EntriesCollection and get rid of this
        if (!model.isNew()) {
          options.ignoreWriteFieldBlacklisted = true;
        }

        model.save(diff, options);
      },

      'click #delete-form': function(e) {
        this.model.save({active: 0}, {success: function() {
          app.router.go('#users');
        }, patch: true});
      }
    },

    serialize: function() {
      var breadcrumbs = [{ title: 'Users', anchor: '#users'}];
      var title = (this.model.id) ? this.model.get('first_name') + ' ' + this.model.get('last_name') : 'New User';

      return {
        breadcrumbs: breadcrumbs,
        title: title,
        sidebar: true
      };
    },

    beforeRender: function() {
      this.setView('#sidebar', new SaveModule({model: this.model}));
    },

    afterRender: function() {
      var editView = new Directus.EditView({model: this.model});
      this.setView('#page-content', editView);
      if (!this.model.isNew()) {
        this.model.fetch();
      } else {
        editView.render();
      }
    }
  });

  var BodyView = Backbone.Layout.extend({

    tagName: 'ul',

    attributes: {
      class: "cards row"
    },

    events: {
      'click li': function(e) {
        var id = $(e.target).closest('li').attr('data-id');

        var user = app.getCurrentUser();
        var userGroup = user.get('group');

        //@todo fix this so it respects ACL instead of being hardcoded
        if (!(parseInt(id,10) === user.id || userGroup.id === 0)) {
          return;
        }

        app.router.go('#users', id);
      }
    },

    template: Handlebars.compile(
      '{{#rows}}' +
      '<li class="card col-2 gutter-bottom {{#if online}}active{{/if}}" data-id="{{id}}" data-cid="{{cid}}">' +
        '<div class="header-image primary-border-color">' +
          '{{avatar}} <div class="tool-item large-circle"><span class="icon icon-pencil"></span></div></div>' +
        '<div class="info">' +
          '<div class="featured">' +
            '<div class="primary-info">' +
              '<div>{{first_name}}</div>' +
              '<div>{{last_name}}</div>' +
            '</div>' +
            '<div class="secondary-info">{{position}}</div>' +
          '</div>' +
          '<ul class="extra">' +
            '<li>{{address}}<span class="icon icon-home"></span></li>' +
            '<li>{{phone_number}}<span class="icon icon-phone"></span></li>' +
            '<li>{{email}}<span class="icon icon-mail"></span></li>' +
          '</ul>' +
        '</div>' +
      '</li>' +
      '{{/rows}}'
    ),

    serialize: function() {
      var rows = this.collection.map(function(model) {

        var data = {
          "id": model.get('id'),
          "cid": model.cid,
          'avatar': model.get('avatar'),
          'first_name': model.get('first_name'),
          'last_name': model.get('last_name'),
          'email': model.get('email'),
          'position': model.get('position'),
          'address': model.get('address'),
          'phone_number': model.get('phone'),
          'online': (moment(model.get('last_access')).add('m', 5) > moment())
        };

        if (data.avatar !== null) {
            //@todo this is a hack, maybe change avatar so it only includes a hash?
            var avatarSmall = data.avatar.replace('?s=100','?s=200');
            data.avatar = new Handlebars.SafeString('<img src="' + avatarSmall + '" style="width:200px;height:200px"/>');
        }

        return data;

      });

      return {rows: rows};
    },

    initialize: function(options) {
      this.collection.on('sort', this.render, this);
    }

  });

  Users.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      var data = {title: 'Users'};

      if (this.collection.hasPermission('add')) {
        data.showAddButton = {
          title: 'Add User'
        };
      }

      return data;
    },

    events: {
      'click #btn-top': function() {
        app.router.go('#users','new');
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch();
    },

    initialize: function() {
      this.table = new BodyView({collection:this.collection});
    }
  });

  return Users;
});