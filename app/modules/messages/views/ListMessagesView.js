define([
  'app',
  'underscore',
  'utils',
  'backbone',
  'core/t',
  'core/notification',
  'core/BasePageView',
  'modules/messages/views/MessageItemView',
  'modules/messages/views/MessageView',
  'modules/messages/views/NewMessageView',
  'core/widgets/widgets'
], function(app, _, Utils, Backbone, __t, Notification, BasePageView, MessageItemView, MessageView, NewMessageView,  Widgets) {

  var isResizing = false;
  var lastDownX = 0;
  var resizeMessages = function (event, $el, force) {
    if (!isResizing && !force) {
      return;
    }

    event.preventDefault();

    var offsetLeft = (force)? parseInt($el.find('.resize-left').css('width'), 10) : event.clientX - $el.offset().left;
    offsetLeft = Math.max(offsetLeft, parseInt($el.find('.resize-left').css('min-width'), 10));

    var widthRight = $el.width() - offsetLeft;
    if(widthRight <= parseInt($el.find('.resize-right').css('min-width'), 10)){
      widthRight = parseInt($el.find('.resize-right').css('min-width'), 10);
      offsetLeft = $el.width() - widthRight;
    }

    // Convert to percentages
    var offsetLeftPercent = (offsetLeft / $el.width()) * 100;
    var widthRightPercent = (widthRight / $el.width()) * 100;

    $el.find('.resize-left').css('width', offsetLeftPercent+'%');
    $el.find('.resize-right').css('left', offsetLeftPercent+'%').css('width', widthRightPercent+'%');
  };

  var ListView = Backbone.Layout.extend({

    template: 'modules/messages/messages-list',

    attributes: {
      class: 'message-listing resize-left'
    },

    events: {
      'click .js-close-message': 'onCloseMessage'
    },

    onCloseMessage: function () {
      var prev = this.getCurrentMessage();

      if (prev) {
        prev.deselect();
      }

      this.$(this.dom.MESSAGE_VIEW).removeClass(this.dom.SHOW_MESSAGE_CONTENT);
      this.setCurrentMessage(null);
    },

    setCurrentMessage: function (message) {
      this.state.previousMessage = this.state.currentMessage;
      this.state.currentMessage = message;
    },

    onItemClick: function (view) {
      var id = view.model.id;
      var messageModel = this.collection.get(id);

      if (messageModel) {
        this.setCurrentMessage(messageModel);
        app.router.navigateTo('/messages/' + id);
        this.displayMessage(id, null, true);
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

    state: {},

    dom: {
      SHOW_MESSAGE_CONTENT: 'show-responsive-message',
      MESSAGE_VIEW: '#message'
    },

    serialize: function () {
      return {
        contentVisible: !!this.state.currentMessage,
        visibleContentClass: this.dom.SHOW_MESSAGE_CONTENT,
        messageCount: this.collection.length
      };
    },

    addItem: function (model, render, prepend) {
      var itemView = new MessageItemView({
        model: model,
        parentView: this
      });

      this.state.itemViews[model.id] = itemView;

      this.listenTo(itemView, 'clicked', this.onItemClick);
      this.listenTo(itemView, 'select', this.onItemSelect);

      this.addItemView(itemView, render, prepend);
    },

    addItemView: function (view, render, prepend) {
      if (prepend === true) {
        this.prependView(view);
      } else {
        this.insertView(view);
      }

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
        this.displayNewMessage();
        return;
      }

      if (this.collection.get(currentMessage)) {
        this.displayMessage(currentMessage, this.options.jumpToResponse);
      }
    },

    afterRender: function() {
      if (this.state.currentMessage) {
        this.$(this.dom.MESSAGE_VIEW).show();
      }
    },

    getPreviousMessage: function () {
      var previous = this.state.previousMessage;

      return previous ? this.state.itemViews[previous.id] : null;
    },

    getCurrentMessage: function () {
      var current = this.state.currentMessage;

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
              from: app.user.id
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
        from: app.user.id
      }, {
        collection: app.messages,
        parse: true
      });

      var newMessageView = new NewMessageView({
        parentView: this,
        model: model
      });

      this.setCurrentMessage(model);
      this.options.parentView.disableArchiveButton();

      this.setView('#message-right-content', newMessageView);
      this.$(this.dom.MESSAGE_VIEW).addClass(this.dom.SHOW_MESSAGE_CONTENT);

      newMessageView.render();
    },

    displayMessage: function (id, jumpTo, render) {
      var current = this.getCurrentMessage();
      var messageView;
      var newMessageView;
      var views;

      this.deselectAll();

      if (current) {
        current.select();
      }

      // when display a message user should be allow to archive the current open message
      this.options.parentView.enableArchiveButton();

      views = this.getContentViews(id);
      messageView = views.content;
      newMessageView = views.form;

      this.removeView('#message-right-content');
      this.insertView('#message-right-content', messageView);
      this.insertView('#message-right-content', newMessageView);

      this.$(this.dom.MESSAGE_VIEW).addClass(this.dom.SHOW_MESSAGE_CONTENT);

      if (this.options.jumpToResponse) {
        messageView.jumpTo(this.options.jumpToResponse);
        this.options.jumpToResponse = null;
      }

      if (render === true) {
        messageView.render();
        newMessageView.render();
      }
    },

    deselectAll: function () {
      _.each(this.state.itemViews, function (view) {
        if (view) {
          view.deselect();
        }
      });
    },

    onNewMessages: function (messages) {
      var renderCurrentView = false;
      var currentMessage = this.getCurrentMessage();

      messages.forEach(function (data) {
        var model = this.collection.get(data.id);
        var view = this.state.itemViews[model.id];

        if (currentMessage && !renderCurrentView) {
          if (data.id === currentMessage.model.id) {
            renderCurrentView = true;
          }
        }

        if (!view) {
          this.addItem(new this.collection.model(data), true, true);
        } else {
          view.markAsUnread();
          view.render();
        }
      }, this);

      // TODO: Fix this, not working
      // implement a separate view for each responses
      if (currentMessage && renderCurrentView) {
        var views = this.getContentViews(currentMessage.model.id);

        views.content.render();
      }
    },

    initialize: function (options) {
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

      app.on('messages:new', this.onNewMessages, this);

      this.listenTo(this.collection, 'sync', function (collection, resp, options) {
        if (options.silent !== true) {
          this.state.currentMessage = null;
        }
      });

      this.state = {
        currentMessage: null,
        previousMessage: null,
        lastMessageId: this.collection.maxId,
        itemViews: {},
        contentViews: {}
      };

      if (options.currentMessage) {
        this.state.currentMessage = this.collection.get(options.currentMessage);
      }
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

    leftToolbar: function () {
      var canSendMessages = app.user.canSendMessages();
      var widgets = [
        // TODO: Add option to disable button widget
        // same as SaveButtonWidget
        new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'add',
            buttonClass: canSendMessages ? 'primary' : 'disabled',
            buttonText: __t('message_compose')
          },
          onClick: _.bind(function () {
            if (canSendMessages) {
              this.table.deselectAll();
              this.table.displayNewMessage();
            }
          }, this)
        })
      ];

      var messageView = this.table;
      this.archiveButton = new Widgets.ButtonWidget({
        widgetOptions: {
          buttonId: 'deleteBtn',
          iconClass: 'archive',
          buttonClass: !this.showDeleteButton ? 'disabled blank' : 'blank',
          buttonText: __t('archive')
        },
        onClick: _.bind(function (event) {
          var ids = [];
          var $checksChecked = this.table.$('.js-select-row:checked');

          if (!this.showDeleteButton) {
            return;
          }

          if ($checksChecked.length) {
            _.each($checksChecked, function (checkbox) {
              var $message = $(checkbox).parents('.js-message');

              ids.push($message.data('id'));
            });
          } else if (this.table.state.currentMessage) {
            ids.push(this.table.state.currentMessage.id);
          }

          if (ids.length === 0) {
            Notification.warning(__t('select_message_to_archive'));
            return;
          }

          var models = this.collection.filter(function (model) {
            return _.contains(ids, model.id);
          });

          if (models) {
            this.collection.destroy(models, {wait: true}).then(function () {
              messageView.displayNewMessage();
            });
          }
        }, this)
      });

      widgets.push(this.archiveButton);

      widgets.push(new Widgets.FilterButtonWidget());

      return widgets;
    },

    rightToolbar: function() {
      var filterProperties = this.filterProperties();

      return [
        new Widgets.FilterWidget(_.extend(filterProperties, {
          collection: this.collection,
          basePage: this
        }))
      ];
    },

    filterProperties: function () {
      var collection = this.collection;

      return {
        onClickState: function ($checksChecked) {
          var status = [];

          $checksChecked.each(function (i, el) {
            status.push($(el).val());
          });

          collection.setFilter({states: status.join(',')});
          collection.fetch();
        },

        stateName: '',

        states: function () {
          if (!collection.getFilter('states')) {
            collection.setFilter('states', '0');
          }

          var filteredStates = Utils.parseCSV(collection.getFilter('states'));

          return [
            {
              name: __t('messages_state_inbox'),
              value: 0,
              selected: _.contains(filteredStates, '0')
            },
            {
              name: __t('messages_state_archive'),
              value: 1,
              selected: _.contains(filteredStates, '1')
            }
          ]
        }
      }
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

    afterRender: function () {
      this.$('.resize-handle').on('mouseover', function (event) {
        $('.resize-left').addClass('resize-hover');
      });

      this.$('.resize-handle').on('mouseout', function (event) {
        $('.resize-left').removeClass('resize-hover');
      });

      this.$('.resize-handle').on('mousedown', function (event) {
        event.preventDefault();
        $('.resize-left').addClass('resize-active');
        isResizing = true;
        lastDownX = event.clientX;
        // console.log(1, lastDownX);
      });

      lastDownX = this.$('.resize-left').css('width');

      var $el = this.$el;
      $(document).on('mousemove.messages', function (event) {
        resizeMessages(event, $el, false);
      }).on('mouseup.messages', function (event) {
        $('.resize-left').removeClass('resize-active');
        isResizing = false;
      });

      this.options.jumpToResponse = null;
      _.each(this.state.itemViews, function (view) {
        view.jumpTo(null);
      });
    },

    cleanup: function () {
      $(document).off('mousemove.messages');
      $(document).off('mouseup.messages');
    },

    enableArchiveButton: function () {
      this.showDeleteButton = true;
      this.archiveButton.removeClass('disabled');
    },

    disableArchiveButton: function () {
      this.showDeleteButton = false;
      this.archiveButton.addClass('disabled');
    },

    initialize: function (options) {
      this.table = new ListView({
        currentMessage: options.currentMessage,
        jumpToResponse: options.jumpToResponse,
        collection: this.collection,
        parentView: this
      });

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
