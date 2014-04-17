define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets'
],

function(app, Backbone, Directus, BasePageView, Widgets) {

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: "Compose",
        breadcrumbs: [{title: 'Messages', anchor: '#messages'}]
      }
    },

    leftToolbar: function() {
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "icon-paper-plane"}})
      ];
    },
    events: {
      'click #addBtn': function(e) {
        var data = this.editView.data();

        data.read = "1";
        data.date_updated = new Date();

        this.model.save(data, {success: function() {
          app.router.go('#messages');
        }});

        this.model.collection.add(this.model);
      }
    },

    afterRender: function() {
      this.editView = new Directus.EditView({model: this.model});
      this.setView('#page-content', this.editView);
      this.editView.render();
    }

  });
});