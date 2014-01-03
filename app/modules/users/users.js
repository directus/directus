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
        }

        // @todo, fix EntriesCollection and get rid of this
        if (!model.isNew()) {
          options.ignoreWriteFieldBlacklisted = true;
        }

        model.save(diff, options);
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

    tagName: 'tbody',

    template: Handlebars.compile('{{#rows}}<tr data-id="{{id}}" data-cid="{{cid}}"><td></td><td>{{avatar}}</td><td>{{first_name}}</td><td>{{last_name}}</td><td>{{group}}</td><td>{{email}}</td><td>{{position}}</td><td>{{default_studio}}</td><td>{{last_access}}</td></tr>{{/rows}}'),

    serialize: function() {
      var rows = this.collection.map(function(model) {
        var data = {
          "id": model.get('id'),
          "cid": model.cid,
          'avatar': model.get('avatar'),
          'first_name': model.get('first_name'),
          'last_name': model.get('last_name'),
          'group': model.get('group').get('name'),
          'email': model.get('email'),
          'position': model.get('position'),
          'default_studio': model.get('default_studio'),
          'last_access': model.get('last_access')
        };

        if (data.avatar !== null) {
            //@todo this is a hack, maybe change avatar so it only includes a hash?
            var avatarSmall = data.avatar.replace('?s=100','?s=50');
            data.avatar = new Handlebars.SafeString('<img src="' + avatarSmall + '" class="avatar" />');
        }

        return data;
      });
      return {rows: rows};
    },

    initialize: function(options) {
      this.collection.on('sort', this.render, this);
    }

  });

  var ListView = Directus.Table.extend({

    TableBody: BodyView,

    navigate: function(id) {
      var user = app.getCurrentUser();
      var userGroup = user.get('group');

      if (!(parseInt(id,10) === user.id || userGroup.id === 0)) {
        return;
      }

      app.router.go('#users', id);
      //app.router.navigate('#users/' + id);
      //app.router.setPage(Users.Views.Edit, {model: this.collection.get(id)});
    }
  });

  Users.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      var data = {title: 'Users'};

      if (this.collection.hasPermission('add')) {
        data.buttonTitle = 'Add New User';
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
      this.table.render();
      //this.collection.fetch();
    },

    initialize: function() {
      this.table = new ListView({collection:this.collection, toolbar: false, navigate: true, selectable:false, hideColumnPreferences: true});
    }
  });

  return Users;
});