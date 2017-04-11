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

    setCurrentMessage: function (message) {
      this.state.previousMessage = this.state.currentMessage;
      this.state.currentMessage = message;
    },

    onItemClick: function (view) {
      var id = view.model.id;
      var messageModel = this.collection.get(id);

      if (messageModel) {
        this.setCurrentMessage(messageModel);
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

    state: {},

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
        this.displayNewMessage();
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

      this.setCurrentMessage(model);
      this.options.parentView.disableArchiveButton();

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

      // when display a message user should be allow to archive the current open message
      this.options.parentView.enableArchiveButton();

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

    deselectAll: function () {
      _.each(this.state.itemViews, function (view) {
        if (view) {
          view.deselect();
        }
      });
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

      this.listenTo(this.collection, 'sync', function () {
        this.state.currentMessage = null;
      });

      this.state = {
        currentMessage: null,
        previousMessage: null,
        lastMessageId: this.collection.maxId,
        itemViews: {},
        contentViews: {}
      };
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
            this.table.deselectAll();
            this.table.displayNewMessage();
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
          if (!this.showDeleteButton) {
            return;
          }

          var ids = [];
          if (this.table.state.currentMessage) {
            ids.push(this.table.state.currentMessage.id);
          } else {
            var $checksChecked = this.table.$('.js-select-row:checked');

            _.each($checksChecked, function (checkbox) {
              ids.push($(checkbox).parent().data('id'));
            });
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

          var filteredStates = (collection.getFilter('states') || '').split(',');

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

    initialize: function() {
      this.table = new ListView({
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
