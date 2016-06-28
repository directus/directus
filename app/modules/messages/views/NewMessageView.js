define([
  'app',
  'backbone',
  'core/t',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets',
  'moment',
  'core/notification'
],
function(app, Backbone, __t, Directus, BasePageView, Widgets, moment, Notification) {

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: __t('message_compose'),
        breadcrumbs: [{title: __t('messages'), anchor: '#messages'}]
      }
    },

    leftToolbar: function() {
      return  [
        new Widgets.ButtonWidget({widgetOptions: {buttonId: "addBtn", iconClass: "send", buttonClass: "", buttonText: __t('send_message')}})
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
