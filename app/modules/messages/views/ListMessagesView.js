define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'core/BasePageView',
  'modules/messages/views/MessageItemView',
  'modules/messages/views/MessageView',
  'modules/messages/views/NewMessageView',
  'core/widgets/widgets'
], function(app, _, Backbone, __t, BasePageView, MessageItemView, MessageView, NewMessageView,  Widgets) {

  var ListView = Backbone.Layout.extend({

    template: 'modules/messages/messages-list',

    attributes: {
      class: 'message-listing resize-left'
    },

    onItemClick: function (view) {
      var id = view.model.id;
      var messageModel = this.collection.get(id);

      if (messageModel) {
        this.state.previousMessage = this.state.currentMessage;
        this.state.currentMessage = messageModel;
        this.displayMessage(id, true);
      } else {
        console.warn('message with id: ' + id + ' does not exists.');
      }
    },

    onItemSelect: function () {
      this.select();
    },

    select: function() {
      this.collection.trigger('select');
    },

    state: {
      currentMessage: null,
      previousMessage: null,
      lastMessageId: null,
      itemViews: {},
      contentViews: {}
    },

    dom: {
      MESSAGE_VIEW: '#message'
    },

    serialize: function () {
      return {
        messageCount: this.collection.length
      };
    },

    addItem: function (model, render) {
      var itemView = new MessageItemView({
        model: model,
        parentView: this
      });

      this.state.itemViews[model.id] = itemView;

      this.listenTo(itemView, 'clicked', this.onItemClick);
      this.listenTo(itemView, 'select', this.onItemSelect);

      this.addItemView(itemView, render);
    },

    addItemView: function (view, render) {
      this.insertView(view);

      if (render === true) {
        view.render();
      }
    },

    addItems: function () {
      this.collection.each(function (model) {
        this.addItem(model);
      }, this);
    },

    beforeRender: function() {
      var currentMessage = this.state.currentMessage;

      this.addItems();

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

    getPreviousMessage: function () {
      var previous = this.previousMessage;

      return previous ? this.state.itemViews[previous.id] : null;
    },

    getCurrentMessage: function () {
      var current = this.currentMessage;

      return current ? this.state.itemViews[current.id] : null;
    },

    getContentViews: function (id) {
      var model;

      if (!this.state.contentViews[id]) {
        model = this.collection.get(id);
        this.state.contentViews[id] = {
          model: model,
          content: new MessageView({
            model: model,
            parentView: this
          }),
          form: new NewMessageView({
            parentModel: model,
            model: new app.messages.model({
              from: app.users.getCurrentUser().id
            }, {
              collection: app.messages,
              parse: true
            }),
            parentView: this
          })
        };
      }

      return this.state.contentViews[id];
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
      var messageView;
      var newMessageView;
      var views;
      var previous = this.getPreviousMessage();
      var current = this.getCurrentMessage();

      if (previous) {
        previous.deselect();
      }

      if (current) {
        current.select();
      }

      views = this.getContentViews(id);
      messageView = views.content;
      newMessageView = views.form;

      this.removeView('#message-right-content');
      this.insertView('#message-right-content', messageView);
      this.insertView('#message-right-content', newMessageView);

      if (render === true) {
        messageView.render();
        newMessageView.render();
      }
    },

    initialize: function () {
      this.listenTo(this.collection, 'add remove', this.render);
      // @TODO: Fix adding new messages
      // Getting a new message will re-render everything
      // clearing any message that it could be have writing.
      // this.listenTo(this.collection, 'sync', function () {
      //   if (this.state.lastMessageId != this.collection.maxId) {
      //     this.state.lastMessageId = this.collection.maxId;
      //     this.render();
      //   }
      // });

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
      var view = this.table;
      this.setView('#page-content', view);
      BasePageView.prototype.beforeRender.call(this);
    },

    initialize: function() {
      this.table = new ListView({collection: this.collection});
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
      // this.listenTo(this.collection, 'add', _.bind(this.table.addItem, this.table));
    }
  });
});
