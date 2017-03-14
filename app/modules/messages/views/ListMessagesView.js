define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'core/BasePageView',
  'modules/messages/views/MessageView',
  'modules/messages/views/NewMessageView',
  'modules/messages/views/MessageForm',
  'core/widgets/widgets',
  'moment'
], function(app, _, Backbone, __t, BasePageView, MessageView, NewMessageView, MessageForm, Widgets, moment) {

  var ListView = Backbone.Layout.extend({

    template: 'modules/messages/messages-list',

    attributes: {
      class: 'message-listing resize-left'
    },

    events: {
      'click .js-select-row': 'select',
      'click .js-send': function() {
        var messageModel = this.collection.get(this.state.currentMessage);
        var collection = messageModel.get('responses');
        // var Model = collection.model;
        var editView = this.messageForm;
        var data = editView.$el.serializeObject();
        var errors = editView.model.validate(data);
        var newModel = editView.model;

        if (errors) {
          newModel.trigger('invalid', newModel, errors);
          return;
        }

        var recipients = _.map(messageModel.get('recipients').split(','), function(id) {
          return '0_' + id;
        });

        recipients.push('0_' + messageModel.get('from'));

        var attrs = _.extend({
          'from': app.users.getCurrentUser().get('id'),
          'subject': 'RE: ' + messageModel.get('subject'),
          'recipients': recipients.join(','),
          // @TODO: Server must set this attribute
          'datetime': moment().format("YYYY-MM-DD HH:mm:ss"),
          'response_to': messageModel.id,
          'responses': []
        }, data);

        var success = function() {
          collection.add(newModel);
        };

        // @TODO: Get ID after create message
        // Create an API endpoint for new messages
        // returning a JSON with the new message
        newModel.save(attrs, {success: success});
        this.render();
      },
      'click .js-message': function(event) {
        var id = $(event.currentTarget).data('id');
        var messageModel = this.collection.get(id);

        if (messageModel) {
          this.state.currentMessage = messageModel;
          this.displayMessage(id, true);
        } else {
          console.warn('message with id: ' + id + ' does not exists.');
        }
      }
    },

    select: function() {
      this.collection.trigger('select');
    },

    state: {
      currentMessage: null,
      lastMessageId: null
    },

    dom: {
      MESSAGE_VIEW: '#message'
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

    beforeRender: function() {
      var currentMessage = this.state.currentMessage;

      if (this.collection.length) {
        this.$el.removeClass('empty');
      } else {
        this.$el.addClass('empty');
      }

      if (!currentMessage) {
        return;
      }

      if (this.collection.get(currentMessage)) {
        this.displayMessage(currentMessage);
      }
    },

    afterRender: function() {
      if (this.state.currentMessage) {
        this.$(this.dom.MESSAGE_VIEW).show();
      }
    },

    displayNewMessage: function() {
      var model = new app.messages.model({
        from: app.users.getCurrentUser().id
      }, {
        collection: app.messages,
        parse: true
      });

      var newMessageView = new NewMessageView({
        parentView: this,
        model: model
      });

      this.setView('#message-right-content', newMessageView);
      newMessageView.render();
    },

    displayMessage: function(id, render) {
      var messageView = new MessageView({
        model: this.collection.get(id),
        parentView: this
      });

      this.setView('#message-right-content', messageView);

      if (render === true) {
        messageView.render();
      }
    },

    initialize: function() {
      this.collection.on('add', this.render, this);
      // @TODO: Fix adding new messages
      // Getting a new message will re-render everything
      // clearing any message that it could be have writing.
      this.collection.on('sync', function() {
        if (this.state.lastMessageId != this.collection.maxId) {
          this.state.lastMessageId = this.collection.maxId;
          this.render();
        }
      }, this);

      this.state.lastMessageId = this.collection.maxId;
    }
  });

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: __t('messages')
      }
    },

    attributes: {
      class: 'page-container messages'
    },

    leftToolbar: function() {
      var widgets = [
        new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'add',
            buttonClass: 'primary',
            buttonText: __t('message_compose')
          },
          onClick: _.bind(function () {
            this.table.displayNewMessage();
          }, this)
        })
      ];

      if (this.showDeleteButton) {
        widgets.push(new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'deleteBtn',
            iconClass: 'archive',
            buttonClass: '',
            buttonText: __t('archive')
          },
          onClick: _.bind(function(event) {
            var $checksChecked = this.table.$('.js-select-row:checked');
            var ids = [];

            _.each($checksChecked, function(checkbox) {
              ids.push($(checkbox).parent().data('id'));
            });

            var models = this.collection.filter(function(model) {
              return _.contains(ids, model.id);
            });

            if (models) {
              this.collection.destroy(models, {wait: true});
            }
          }, this)
        }));
      }

      return widgets;
    },

    rightToolbar: function() {
      return [
        new Widgets.FilterWidget({
          collection: this.collection,
          basePage: this
        })
      ];
    },

    serialize: function() {
      return {
        title: 'Messages',
        buttonTitle: 'Compose'
      };
    },

    beforeRender: function() {
      var view = this.table = new ListView({collection: this.collection});
      this.setView('#page-content', view);
      BasePageView.prototype.beforeRender.call(this);
    },

    initialize: function() {
      this.collection.on('select', function() {
        var $checksChecked = this.table.$('.js-select-row:checked');
        // @NOTE: Hotfix render on empty selection
        var render = this.showDeleteButton && !($checksChecked.length >= 1);
        this.showDeleteButton = $checksChecked.length >= 1;

        if (render || this.showDeleteButton) {
          this.reRender();
        }
      }, this);

      // @TODO: Add new messages into the list without re rendering the existing messages
      // to prevent the annoying render that deletes all the text that hasn't been sent yet
      this.collection.on('remove', this.render, this);
    }
  });
});
