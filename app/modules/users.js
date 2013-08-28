define([
  "app",
  "backbone",
  "core/directus",
  'core/panes/pane.saveview'
],

function(app, Backbone, Directus, SaveModule) {

  var Users = app.module();
/*
  var SaveModule = Backbone.Layout.extend({
    template: 'module-save',
    attributes: {'class': 'directus-module'},
    serialize: function() {
      return {
        isNew: (this.model.id === undefined),
        showActive: true,
        isActive: this.model.isNew() || (this.model.get('active') === 1),
        isInactive: (this.model.get('active') === 2)
      };
    },
    initialize: function() {
      this.model.on('sync', this.render, this);
    }
  });
*/

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

        model.save(model.diff(data), {
          success: function() { app.router.go('#users'); },
          error: function() { console.log('error',arguments); },
          patch: true,
          includeRelationships: true
        });
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
      this.setView('#page-content', new Directus.EditView({model: this.model}));
      if (!this.model.isNew()) {
        this.model.fetch();
      }
    }
  });

  var ListView = Directus.Table.extend({
    navigate: function(id) {
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
      this.collection.fetch();
    },

    initialize: function() {
      this.table = new ListView({collection:this.collection, toolbar: false, navigate: true, selectable:false, hideColumnPreferences: true});
    }
  });

  return Users;
});