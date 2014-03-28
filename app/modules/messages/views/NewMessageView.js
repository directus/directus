define([
  'app',
  'backbone',
  'core/BasePageView'
],

function(app, Backbone, BasePageView) {

  return BasePageView.extend({

    events: {
      'click #save-form': function(e) {
        var data = this.editView.data();

        data.read = "1";
        data.date_updated = new Date();

        this.model.save(data, {success: function() {
          app.router.go('#messages');
        }});

        this.model.collection.add(this.model);
      },
      'click #save-form-cancel': function() {
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);
      }
    },

    serialize: function() {
      return {
        title: 'Compose',
        sidebar: true,
        breadcrumbs: [{ title: 'Messages', anchor: '#messages'}]
      };
    },

    beforeRender: function() {
      this.setView('#sidebar', new SaveModule({
        model: this.model,
        buttonText: 'Send Message',
        single: true
      }));
    },

    afterRender: function() {
      this.editView = new Directus.EditView({model: this.model});
      this.setView('#page-content', this.editView);
      this.editView.render();
    }

  });
}