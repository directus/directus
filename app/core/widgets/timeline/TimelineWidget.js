define([
  'app',
  'backbone',
  'jquery',
  'underscore',
  'core/t',
  'core/directus',
  'utils',
  'moment'
],
function(app, Backbone, $, _, __t, Directus, Utils, moment) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'core/widgets/timeline/timeline',

    tagName: 'ul',

    attributes: {
      class: 'timeline'
    },

    events: {
      'click .js-user': 'openUserModal',

      'click .activity-full-toggle': 'showActivityDetails',

      'click .submitComment': function (event) {
        var message = this.$('#itemCommentText').val();
        this.addComment(message);
      },

      'click .tagInsertItem': function (event) {
        var $target = $(event.currentTarget);
        var $commentText = this.$('#itemCommentText');
        var caretPos = $commentText[0].selectionStart;
        var text = $commentText.val();
        var sub = text.substring(0, caretPos);
        var start = sub.lastIndexOf(' ') + 1;
        var startString = sub.substring(start);

        if (startString.substring(0,1) === '@') {
          var endText = text.substring(caretPos, text.length);
          var end = caretPos;

          if (!endText || endText.indexOf(' ') === -1) {
            end = text.length;
          } else {
            end = endText.indexOf(' ') + start + startString.length;
          }

          text = text.substring(0, start) + "@[" + $target.data('id') + " " + $target.data('name') + "] " + text.substring(end, text.length);
          $commentText.val(text);
          this.$('#tagInsert').empty();
        }
      },

      'input #itemCommentText': function (event) {
        var caretPos = $(event.target)[0].selectionStart;
        var text = $(event.target).val();
        var sub = text.substring(0, caretPos);
        var activeChunk = sub.substring(sub.lastIndexOf(' ') + 1);
        var search = activeChunk.substring(1);

        // Enable submit button when content exists
        if (text.length > 0){
          $('#itemCommentText').addClass('active');
          $('#messages-response-button').removeClass('disabled');
        } else {
          $('#itemCommentText').removeClass('active');
          $('#messages-response-button').addClass('disabled');
        }

        if (activeChunk.substring(0, 1) === '@' && search) {
          this.displaySearch(search);
        } else {
          $('#tagInsert').empty();
        }
      },
    },

    openUserModal: function(event) {
      var $target = $(event.currentTarget);
      var userId = $target.data('user-id');

      return app.router.openUserModal(userId);
    },

    showActivityDetails: function(event) {
      var $parent = $(event.currentTarget).parent();

      if ($parent.hasClass('expanded')){
        this.$('.activity').removeClass('expanded');
      } else {
        this.$('.activity').removeClass('expanded');
        $parent.addClass('expanded');
      }
    },

    addComment: function(message) {
      if (!message) {
        return;
      }

      var model = new app.messages.model({from: app.authenticatedUserId.id}, {collection: this.comments, parse: true});
      var tableName = app.capitalize(this.model.collection.table.id);
      var projectTitle = app.settings.get('global').get('project_name');
      var subject = tableName + ': ' + projectTitle;

      var date = moment().format("YYYY-MM-DD HH:mm:ss");
      model.set({
        datetime: date,
        subject: subject,
        message: message,
        comment_metadata: this.model.collection.table.id + ":" + this.model.id
      });
      model.unset('responses');
      model.url = app.API_URL + 'comments/';

      this.listenToOnce(model, 'sync', function(e) {
        this.comments.add(model);
        this.render();
      });

      this.$('#itemCommentButton').prop('disabled', true);
      model.save(null, {validateAttributes: true});
    },

    isCreation: function (model) {
      return model.get('action') === 'ADD';
    },

    serialize: function () {
      var activities = _.sortBy(this.activity.models, function(item) {
        return -item.id;
      });

      // Note: This is only to give the revision a number
      var revisionCount = activities.filter(function (model) {
        return !this.isCreation(model);
      }, this).length;

      var data = activities.map(function (model, index) {
        var isCreated = this.isCreation(model);
        var title;

        if (isCreated) {
          title = __t('directus_activity_action_create');
        } else {
          title = __t('directus_activity_revision_x', {number: revisionCount - index});
        }

        var data = {
          title: title,
          table: model.get('table_name'),
          datetime: moment(model.get('datetime')),
          timeAgo: moment(model.get('datetime')).timeAgo('small'),
          timestamp: model.get('datetime'),
          userId: model.get('user'),
          ip: model.get('logged_ip'),
          action: model.get('action')
        };

        switch (model.get('action')) {
          case 'DELETE':
            data.icon = 'delete';
            data.color = 'delete';
            data.action_text = __t('deleted_this_item');
            break;
          case 'UPDATE':
            data.icon = 'edit';
            data.color = 'edit';
            data.action_text = __t('edited_this_item');
            break;
          case 'ADD':
            data.add = true;
            data.icon = 'check';
            data.color = 'add';
            data.action_text = __t('created_this_item');
            break;
        }

        return data;
      }, this);

      var comments = this.comments.map(function (model) {
        if (_.isEmpty(model.attributes)) {
          return {};
        }

        var data = {
          table: 'Comment',
          timestamp: model.get('datetime'),
          timeAgo: moment(model.get('datetime')).timeAgo('small'),
          userId: model.get('from')
        };

        data.isComment = true;
        data.title = model.get('message');

        return data;
      });

      // FIXME: The comments collection has an empty model
      comments = _.filter(comments, function (comment) {
        return !_.isEmpty(comment);
      });

      data = data.concat(comments);
      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -moment(item.timestamp);
      });

      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          data[key].hidden = (key >= 5) ? 'hide' : 'preview';

          data[key].title = Utils.parseMentions(data[key].title);
        }
      }

      var preview = data.length > 5;
      var additionalCount = data.length - 5;
      var canSendMessages = app.user.canSendMessages();
      var privileges = app.schemaManager.getPrivileges('directus_messages');
      var canAddMessages = privileges && privileges.can('add');

      return $.extend(this.options.widgetOptions, {
        activities: data,
        preview: preview,
        additionalCount: additionalCount,
        current_user: app.authenticatedUserId,
        canComment: canSendMessages && canAddMessages
      });
    },

    fetchActivities: function () {
      var collection = this.model.collection;
      var tableName = collection.table.id;
      var rowId = this.model.id;

      if (!this.canSeeActivities()) {
        return;
      }

      this.activity = app.activity.clone().reset();
      this.activity.clearFilter();
      this.activity.setFilter({
        limit: -1,
        filters: {
          table_name: tableName,
          row_id: rowId
        }
      });

      this.activity.fetch();
    },

    fetchComments: function () {
      var collection = this.model.collection;
      var tableName = collection.table.id;
      var rowId = this.model.id;

      if (!this.canSeeComments()) {
        return;
      }

      this.comments.clearFilter();
      this.comments.setFilter({
        filters: {
          comment_metadata: tableName + ':' + rowId
        }
      });

      this.comments.fetch();
    },

    canSeeComments: function () {
      var privileges = app.schemaManager.getPrivileges('directus_messages');

      return privileges && privileges.can('view');
    },

    canSeeActivities: function () {
      var privileges = app.schemaManager.getPrivileges('directus_activity');

      return privileges && privileges.can('view');
    },

    initialize: function (options) {
      // Get Activity
      this.model = options.model;
      this.activity = app.activity;
      this.comments = new Directus.EntriesCollection({}, {table: app.messages.table, structure: app.messages.structure});

      if (!this.model.isNew()) {
        this.fetchActivities();
        this.fetchComments();
      }

      var otherFetched = false;

      this.listenTo(this.activity, 'sync', function() {
        if (otherFetched || !this.canSeeComments()) {
          this.render();
        }

        otherFetched = true;
      });

      this.listenTo(this.comments, 'sync', function() {
        if (otherFetched || !this.canSeeActivities()) {
          this.render();
        }

        otherFetched = true;
      });

      var users = app.users.filter(function (user) {
        return user.id !== app.authenticatedUserId.id;
      });

      users = users.map(function(item) {
        return {
          id: item.id,
          uid: item.id,
          name: item.get('first_name') + ' ' + item.get('last_name'),
          avatar: item.getAvatar()
        };
      });

      var datums = [];
      this.deletedDatums = [];

      _.each(users, function (item) {
        datums.push({
          id: item.uid,
          name: item.name,
          avatar: item.avatar,
          tokens: item.name.split(' ')
        });
      });

      var engine = new Bloodhound({
        name: 'users',
        local: datums,
        datumTokenizer: function (data) {
          return Bloodhound.tokenizers.whitespace(data.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace
      });

      this.searchEngine = engine;
      engine.initialize();
    },

    displaySearch: function (query) {
      $('#tagInsert').empty();

      this.searchEngine.get(query, function (res) {
        res.forEach(function (item) {
          $('#tagInsert').append('<div class="tagInsertItem mention-choice" data-id="' + item.id + '" data-name="' + item.name + '"><img src="' + item.avatar + '"/>'  + item.name + '</div>');
        });
      });
    }
  });
});
