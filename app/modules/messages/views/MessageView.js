define([
    'app',
    'backbone',
    'underscore',
    'handlebars',
    'moment'
  ],
  function(app, Backbone, _, Handlebars, moment) {
    return Backbone.Layout.extend({

      maxRecipients: 10,

      template: 'modules/messages/message-content',

      events: {
        'click #messages-response-button': function() {
          var collection = this.model.get('responses');
          var Model = collection.model;

          if ($('#messages-response').val() === '') {
            return;
          }

          var recipients = _.map(this.model.get('recipients').split(','), function(id) {
            return '0_' + id;
          });

          recipients.push('0_' + this.model.get('from'));

          var attrs = {
            'from': app.users.getCurrentUser().get('id'),
            'subject': 'RE: ' + this.model.get('subject'),
            'recipients': recipients.join(','),
            // @TODO: Server must set this attribute
            'datetime': moment().format("YYYY-MM-DD HH:mm:ss"),//new Date().toISOString(),
            'response_to': this.model.id,
            'message': $('#messages-response').val(),
            'responses': []
          };

          var model = new Model(attrs, {
            collection: collection,
            parse: true,
            url: app.API_URL + 'messages/rows/'
          });

          // @TODO: Get ID after create message
          // Create an API endpoint for new messages
          // returning a JSON with the new message
          model.save();
          collection.add(model);
          this.render();
        },

        'click #messages-show-recipients': function() {
          var $el = $('#messages-recipients');
          $el.toggle();
        }
      },

      // Message List view
      parentView: null,

      beforeRender: function() {
        if (!this.parentView) {
          return;
        }

        var $messages = this.parentView.$el.find('.js-message');

        if ($messages) {
          $messages.removeClass('active');
        }

        this.parentView.$el.find('[data-id=' + this.model.get('id') + ']').addClass('active');
      },

      serialize: function() {
        var data = this.model.toJSON();

        data.recipients = data.recipients.split(',');
        data.reads = data.reads.split(',');
        data.recipientsCount = data.recipients.length;
        data.collapseRecipients = data.recipients.length > this.maxRecipients;
        data.current_user = app.authenticatedUserId;

        data.responses = _.sortBy(data.responses, function(response) {
          return new Date(response.datetime);
        });

        var title = data.message;
        var offset = 0;
        while (true) {
          if (title) {
            var atPos = title.indexOf('@[');
            if (atPos !== -1) {
              var spacePos = title.substring(atPos).indexOf(' ');
              if (spacePos !== -1) {
                var substring = title.substring(atPos + 2, spacePos + atPos);
                var contains = /^[0-9]|_+$/.test(substring);
                if (contains) {
                  var bracketPos2 = title.indexOf(']');
                  if (bracketPos2 !== -1) {
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

      initialize: function(options) {
        this.parentView = options.parentView;

        if (!this.model.isRead()) {
          this.parentView.$el.find('[data-id=' + this.model.get('id') + ']').removeClass('unread');
        }

        this.model.markAsRead({save: true});
      }
    });
  });
