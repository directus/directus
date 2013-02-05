define([
  "app",
  "backbone",
  "core/directus"
],

function(app, Backbone, Directus) {

  var Users = app.module();

  var SaveModule = Backbone.Layout.extend({
    template: 'module-save',
    attributes: {'class': 'directus-module'},
    serialize: function() {
      return {
        isNew: (this.model.id === undefined),
        hasActive: this.model.has('active'),
        isActive: (this.model.get('active') === 1),
        isInactive: (this.model.get('active') === 2 || !this.model.has('id')),
        isDeleted: (this.model.get('active') === 0)
      };
    },
    initialize: function() {
      this.model.on('sync', this.render, this);
    }
  });


  Users.Views.Edit = Backbone.Layout.extend({

    template: 'page',

    events: {
      'click .btn-primary': function(e) {
        var data = $('form').serializeObject();
        data.active = 1;
        console.log(data);
        this.model.save(data, {
          success: function() { console.log('success',arguments); },
          error: function() { console.log('error',arguments); }
        });
      }
    },

    serialize: function() {
      console.log(this.model);
      return {
        breadcrumbs: [{title: 'Users', anchor: '#users'}],
        sidebar: true,
        title: this.model.get('first_name') + ' ' + this.model.get('last_name')
      };
    },

    beforeRender: function() {
      this.setView('#page-content', new Directus.EditView({model: this.model}));
      this.setView('#sidebar', new SaveModule({model: this.model}));
    }
  });

  var ListView = Directus.Table.extend({
    navigate: function(id) {
      app.router.navigate('#users/' + id);
      app.router.setPage(Users.Views.Edit, {model: this.collection.get(id)});
    }
  });

  Users.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      return {title: this.collection.table.title, buttonTitle: 'Add new user'};
    },

    events: {
      'click #btn-top': function() {
        var model = new this.collection.model();
        model.collection = this.collection;
        app.router.setPage(Users.Views.Edit, {model: model});
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      this.collection.fetch();
    },

    initialize: function() {
      this.table = new ListView({collection:this.collection, toolbar: false, navigate: true, selectable:false});
    }
  });

  return Users;
});