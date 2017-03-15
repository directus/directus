define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'moment'
], function(app, Backbone, _, Handlebars) {
  return Backbone.Layout.extend({

    maxRecipients: 10,

    template: 'modules/messages/message-content',

    events: {
      'click #messages-show-recipients': function() {
        var $el = $('#messages-recipients');
        $el.toggle();
      },

      'click .js-user': function(event) {
        var $target = $(event.currentTarget);

        app.router.openUserModal($target.data('id'));
      },

      'click .js-file': function(event) {
        var $target = $(event.currentTarget);

        app.router.openFileModal($target.data('id'));
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
      var self = this;

      data.recipients = _.filter((data.recipients || '').split(','), function(userId) {
        userId = Number(userId);

        // Remove the sender from the recipients list
        return Number(userId) !== data.from;
      });
      data.reads = data.reads ? data.reads.split(',') : null;
      data.recipientsCount = data.recipients.length;
      data.collapseRecipients = data.recipients.length > this.maxRecipients;
      data.current_user = app.authenticatedUserId;

      data.attachment = this.parseAttachment(data.attachment);

      data.responses = _.map(data.responses, function(response) {
        response.attachment = self.parseAttachment(response.attachment);

        return response;
      });

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

      if (data.message) {
        data.message = new Handlebars.SafeString(app.replaceAll('\n', '<br>', data.message));
      }

      data.newModel = this.model.clone();
      data.newModel.clear();

      return data;
    },

    parseAttachment: function (attachment) {
      var attachments = attachment.data || attachment;

      return _.map(attachments, function(item) {
        return item;
      });
    },

    initialize: function(options) {
      this.parentView = options.parentView;

      if (!this.model.isRead()) {
        this.parentView.$el.find('[data-id=' + this.model.get('id') + ']').removeClass('unread');
      }

      this.model.markAsRead({save: true});

      var responsesCollection = this.model.get('responses');
      if (responsesCollection) {
        this.listenTo(responsesCollection, 'add remove', this.render);
      }
    }
  });
});
