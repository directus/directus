define([
  'app',
  'backbone',
  'core/BasePageView'
],
function(app, Backbone, BasePageView) {


  var ReadView = Backbone.Layout.extend({

    maxRecipients: 10,

    template: 'modules/messages/messages-reading',

    events: {
      'click #messages-response-button': function() {
        var collection = this.model.get('responses');
        var Model = collection.model;
        var myId = app.users.getCurrentUser().get('id');
        var recipients = _.map(this.model.get('recipients').split(','), function(id) {
          return '0_' + id;
        });

        recipients.push('0_'+this.model.get('from'));

        var attrs = {
          'from': app.users.getCurrentUser().get('id'),
          'subject': '',
          'recipients': recipients.join(','),
          'datetime': (new Date()).toISOString(),
          'response_to': this.model.id,
          'message': $('#messages-response').val(),
          'responses': []
        };

        var model = new Model(attrs, {
          collection: collection,
          parse: true,
          url: app.API_URL + 'messages/rows/'
        });

        model.save();
        collection.add(model);
        this.render();
      },
      'click #messages-show-recipients': function() {
        var $el = $('#messages-recipients');
        $el.toggle();
      }
    },

    serialize: function() {
      var data = this.model.toJSON();
      data.recipients = data.recipients.split(',');
      data.recipientsCount = data.recipients.length;
      data.collapseRecipients = data.recipients.length > this.maxRecipients;

      data.message = new Handlebars.SafeString(app.replaceAll('\n', '<br>', data.message));
      return data;
    },

    initialize: function() {
      this.model.on('change:read', function() {
        this.model.markAsRead({save: true});
        this.render();
      }, this);
      this.model.markAsRead({save: true});
    }

  });

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: "Read",
        breadcrumbs: [{title: 'Messages', anchor: '#messages'}]
      }
    },
    afterRender: function() {
      var readView = new ReadView({model: this.model});
      this.setView('#page-content', readView);
      if (this.model.has('message')) {
        readView.render();
      }
    },
    initialize: function() {
      this.headerOptions.route.title = this.model.get('subject');
    }
  });
});