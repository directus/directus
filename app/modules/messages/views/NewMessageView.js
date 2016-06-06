define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets',
  'moment',
  'core/notification'
],

function(app, Backbone, Directus, BasePageView, Widgets, moment, Notification) {

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: "Compose",
        breadcrumbs: [{title: 'Messages', anchor: '#messages'}]
      }
    },

    leftToolbar: function() {
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "check", buttonClass: "add-color-background"}})
      ];
    },
    events: {
      'click #addBtn': function(e) {
        var data = this.editView.data();

        data.read = "1";
        data.date_updated = moment().format("YYYY-MM-DD HH:mm:ss")

        this.model.save(data, {success: function(model, res) {
          if(res.warning) {
            Notification.warning(null, res.warning, {timeout: 5000});
          }

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
