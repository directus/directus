define([
  'app',
  'backbone',
  'core/t',
  'core/BasePageView',
  'modules/messages/views/MessageView',
  'core/widgets/widgets',
  'moment'
],

function(app, Backbone, __t, BasePageView, MessageView, Widgets, moment) {

  var ListView = Backbone.Layout.extend({

    template: 'modules/messages/messages-list',

    attributes: {
      class: 'message-listing resize-left'
    },

    events: {
      'click .js-message': function(event) {
        var id = $(event.currentTarget).data('id');
        var messageModel = this.collection.get(id);
        // app.router.go('#messages', id);
        if (messageModel) {
          this.state.currentMessage = messageModel;
          this.displayMessage(id, true);
        } else {
          console.warn('message with id: ' + id + ' does not exists.');
        }
      }
    },

    state: {
      currentMessage: null
    },

    serialize: function() {
      var self = this;
      var data = this.collection.map(function(model) {
        var data = model.toJSON();
        var momentDate = moment(data.date_updated);
        var currentMessage = self.state.currentMessage;
        var recipients;

        data.timestamp = parseInt(momentDate.format('X'), 10);
        data.niceDate = moment().diff(momentDate, 'days') > 1 ? momentDate.format('MMMM D') : momentDate.fromNow();
        data.read = model.getUnreadCount() === 0;
        data.responsesLength = data.responses.length;
        data.from = parseInt(data.from, 10);
        data.selected = currentMessage ? (currentMessage.get('id') === data.id) : false;

        if (data.recipients) {
          recipients = data.recipients.split(',');
        } else {
          recipients = [];
        }

        data.recipients = [];
        var extra = 0;

        for (var i=0; i<recipients.length; i++) {
          if (i > 2) {
            extra = recipients.length - i;
            break;
          }

          var user = app.users.get(recipients[i]);
          if (user !== undefined) {
            data.recipients.push(user.get('first_name'));
          }
        }

        data.recipients = data.recipients.join(", ");

        if (extra) {
          data.recipients += " (+"+extra+" more)";
        }

        //console.log(_.map(data.responses, 'from'));
        return data;
      });

      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -item.timestamp;
      });

      return {messages: data};
    },

    displayMessage: function(id, render) {
      var messageView = new MessageView({
        model: this.collection.get(id),
        parentView: this
      });

      this.setView('#message-content', messageView);

      if (render === true) {
        messageView.render();
      }
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: __t('messages')
      }
    },
    leftToolbar: function() {
      return [
        new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'add',
            buttonClass: 'primary',
            buttonText: __t('message_compose')
          },
          onClick: function(event) {
            app.router.go('#messages', 'new');
          }
        })
      ];
    },
    rightToolbar: function() {
      return [
        //new Widgets.SearchWidget()
      ];
    },

    serialize: function() {
      return {
        title: 'Messages',
        buttonTitle: 'Compose'
      };
    },

    beforeRender: function() {
      var view = new ListView({collection: this.collection});
      this.setView('#page-content', view);
      BasePageView.prototype.beforeRender.call(this);
    }
  });
});
