define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'utils',
  'helpers/file'
], function(app, Backbone, _, Handlebars, Utils, FileHelper) {

  return Backbone.Layout.extend({

    maxRecipients: 10,

    template: 'modules/messages/message-content',

    events: {
      'click .js-user': 'onUserClick',

      'click .js-file': 'onFileClick'
    },

    onUserClick: function (event) {
      var $target = $(event.currentTarget);

      app.router.openUserModal($target.data('id'));
    },

    onFileClick: function (event) {
      var $target = $(event.currentTarget);

      app.router.openFileModal($target.data('id'));
    },

    // Message List view
    parentView: null,

    jumpTo: function (id) {
      this.state.jumpTo = id;
    },

    beforeRender: function() {
      if (!this.parentView) {
        return;
      }
    },

    afterRender: function () {
      if (this.state.jumpTo) {
        document.getElementById('message_content_' + this.state.jumpTo).scrollIntoView(true);
        this.state.jumpTo = null;
      }
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

      data.responses = _.map(data.responses, function (response) {
        response.attachment = self.parseAttachment(response.attachment);
        response.reads = response.reads ? response.reads.split(',') : null;

        response.message = new Handlebars.SafeString(app.replaceAll('\n', '<br>', response.message));

        return response;
      });

      data.responses = _.sortBy(data.responses, function(response) {
        return new Date(response.datetime);
      });

      if (data.message) {
        data.message = Utils.parseMentions(data.message);
        data.message = new Handlebars.SafeString(app.replaceAll('\n', '<br>', data.message));
      }

      data.newModel = this.model.clone();
      data.newModel.clear();

      return data;
    },

    parseAttachment: function (attachment) {
      var attachments = attachment.data || attachment;

      return _.map(attachments, function (item) {
        item.type = FileHelper.friendlySubtype(item.type);

        return item;
      });
    },

    initialize: function (options) {
      this.parentView = options.parentView;
      this.state = {};

      if (!this.model.isRead()) {
        this.parentView.$el.find('[data-id=' + this.model.get('id') + ']').removeClass('unread');
      }

      this.model.markAsRead({save: true});

      var responsesCollection = this.model.get('responses');
      if (responsesCollection) {
        this.listenTo(responsesCollection, 'add remove', this.render);
      }
    },

    constructor: function MessageView() {
      return Backbone.Layout.prototype.constructor.apply(this, arguments);
    }
  });
});
