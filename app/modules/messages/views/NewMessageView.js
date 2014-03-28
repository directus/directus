define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView'
],

function(app, Backbone, Directus, BasePageView) {

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: "Compose",
        breadcrumbs: [{title: 'Messages', anchor: '#messages'}]
      }
    },
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

    afterRender: function() {
      this.editView = new Directus.EditView({model: this.model});
      this.setView('#page-content', this.editView);
      this.editView.render();
    }

  });
});