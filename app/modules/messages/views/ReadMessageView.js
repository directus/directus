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

        if($('#messages-response').val() === "") {
          return;
        }

        var recipients = _.map(this.model.get('recipients').split(','), function(id) {
          return '0_' + id;
        });
        recipients.push('0_'+this.model.get('from'));

        var attrs = {
          'from': app.users.getCurrentUser().get('id'),
          'subject': 'RE: ' + this.model.get('subject'),
          'recipients': recipients.join(','),
          'datetime': new Date().toISOString(),
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
      data.datetime += ' UTC';
      data.recipients = data.recipients.split(',');
      data.recipientsCount = data.recipients.length;
      data.collapseRecipients = data.recipients.length > this.maxRecipients;
      data.current_user = app.authenticatedUserId;

      _.each(data.responses, function(data) {
        data.datetime += ' UTC';
      });

      data.responses = data.responses.reverse();

      var title = data.message;
      var offset = 0;
      while(true) {
        if(title) {
          var atPos = title.indexOf('@[');
          if(atPos !== -1) {
            var spacePos = title.substring(atPos).indexOf(' ');
            if(spacePos !== -1) {
              var substring = title.substring(atPos + 2, spacePos + atPos);
              var contains = /^[0-9]|_+$/.test(substring);
              if(contains) {
                var bracketPos2 = title.indexOf(']');
                if(bracketPos2 !== -1) {
                  var name = title.substring(spacePos + 1 + atPos, bracketPos2);
                  var newTitle = data.message;
                  data.message = newTitle.substring(0, atPos + offset) + "<span class=\"mention-tag\">" + name + "</span>";
                  var newOffset = data.message.length;
                  data.message += newTitle.substring(bracketPos2 + offset + 1);
                  title = newTitle.substring(bracketPos2 + offset + 1);
                  offset = newOffset;
                  continue;
                }
              }
            }
          }
        }
        break;
      }

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