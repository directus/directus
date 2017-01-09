define([
  'app',
  'backbone',
  'jquery',
  'underscore',
  'core/t',
  'core/directus',
  'moment'
],
function(app, Backbone, $, _, __t, Directus, moment) {

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

      'keydown #itemCommentText': function(event) {
        if (event.keyCode === 13) {
          var message = this.$('#itemCommentText').val();
          this.addComment(message);
        }
      },

      'click .tagInsertItem': function(event) {
        var target = $(event.target);
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
            end = endText.indexOf(" ") + start +startString.length;
          }

          text = text.substring(0, start) + "@[" + target.data('id') + " " + target.data('name') + "] " + text.substring(end, text.length);
          $commentText.val(text);
          this.$('#tagInsert').empty();
        }
      },

      'input #itemCommentText': function(e) {
        var caretPos = $(e.target)[0].selectionStart;
        var text = $(e.target).val();
        var sub = text.substring(0, caretPos);
        var activeChunk = sub.substring(sub.lastIndexOf(" ") + 1);

        // Enable submit button when content exists
        if(text.length > 0){
          $('#messages-response-button').removeClass('disabled');
        } else {
          $('#messages-response-button').addClass('disabled');
        }

        if(activeChunk.substring(0,1) === "@") {
          var search = activeChunk.substring(1);

          if(search) {
            this.displaySearch(search);
          } else {
            $('#tagInsert').empty();
          }
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
      var subject = '[' + app.settings.get('global').get('project_name') + '] ' + app.capitalize(this.model.collection.table.id) + ': "' + this.model.get(this.model.table.get('primary_column')) + '"';

      var date = moment().format("YYYY-MM-DD HH:mm:ss");
      model.set({
        datetime: date,
        subject: subject,
        message: message,
        comment_metadata: this.model.collection.table.id + ":" + this.model.get('id')
      });
      model.unset('responses');
      model.url = app.API_URL + 'comments/';

      this.listenToOnce(model, 'sync', function(e) {
        this.comments.add(model);
        this.render();
      });

      this.$('#itemCommentButton').prop('disabled', true);
      model.save();
    },

    serialize: function() {
      // Note: This is only to give the revision a number
      var activityCount = this.activity.length;
      var activities = _.sortBy(this.activity.models, function(item) {
        return -item.id;
      });

      var data = activities.map(function(model, index) {
        var data = {
          revisionNumber: activityCount - index,
          table: model.get('table_name'),
          datetime: moment(model.get('datetime')),
          timeAgo: moment(model.get('datetime')).fromNow(),
          timestamp: model.get('datetime'),
          userId: model.get('user'),
          ip: model.get('logged_ip'),
          action: model.get('action')
        };

        switch(model.get('action')) {
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
      });

      var comments = this.comments.map(function(model) {
        var data = {
          table: 'Comment',
          timestamp: model.get('datetime'),
          timeAgo: moment(model.get('datetime')).fromNow(),
          userId: model.get('from')
        };

        data.isComment = true;
        data.title = model.get('message');

        return data;
      });

      data = data.concat(comments);
      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -moment(item.timestamp);
      });
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          data[key].hidden = (key >= 5)? 'hide' : 'preview';

          var title = data[key].title;
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
                      var newTitle = data[key].title;
                      data[key].title = newTitle.substring(0, atPos + offset) + '<span class="mention-tag">' + name + '</span>';
                      var newOffset = data[key].title.length;
                      data[key].title += newTitle.substring(bracketPos2 + offset + 1);
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

        }
      }

      var preview = data.length > 5;
      var additionalCount = data.length - 5;


      return $.extend(this.options.widgetOptions, {activities: data, preview: preview, additionalCount: additionalCount, current_user: app.authenticatedUserId});
    },

    initialize: function(options) {
      //Get Activity
      this.model = options.model;
      this.activity = app.activity;
      this.comments = new Directus.EntriesCollection({}, {table: app.messages.table, structure: app.messages.structure});

      if(!this.model.isNew()) {
        this.activity.setFilter({adv_search: 'table_name = "' + this.model.collection.table.id + '" AND row_id = ' + this.model.get(this.model.idAttribute)});
        this.activity.fetch();
        this.comments.setFilter({adv_where: 'comment_metadata = "' + this.model.collection.table.id + ":" + this.model.get(this.model.idAttribute) + '"'});
        this.comments.fetch();
      }

      var otherFetched = false;

      this.listenTo(this.activity, 'sync', function() {
        if(otherFetched) {
          this.render();
        }
        otherFetched = true;
      });

      this.listenTo(this.comments, 'sync', function() {
        if(otherFetched) {
          this.render();
        }
        otherFetched = true;
      });

      var DIRECTUS_USERS = 0;
      var DIRECTUS_GROUPS = 1;

      var users = app.users.filter(function(item) {
        if(item.get('id') === app.authenticatedUserId.id) {
          return false;
        }
        return true;
      });

      users = users.map(function(item) {
        return {
          id: item.id,
          uid: DIRECTUS_USERS + '_' + item.id,
          name: item.get('first_name') + ' ' + item.get('last_name'),
          avatar: item.getAvatar(),
          type: DIRECTUS_USERS
        };
      });

      var groups = app.groups.map(function(item) {
        return {
          id: item.id,
          uid: DIRECTUS_GROUPS + '_' + item.id,
          name: item.get('name'),
          avatar: app.PATH + 'assets/img/directus-group-avatar-100x100.jpg',
          type: DIRECTUS_GROUPS
        };
      });

      var usersAndGroups = users.concat(groups);
      var datums = [];
      this.deletedDatums = [];

      _.each(usersAndGroups, function(item) {
        var uid = item.uid;

        datums.push({
          id: uid,
          name: item.name,
          avatar: item.avatar,
          tokens: item.name.split(' ')
        });
      });

      var engine = new Bloodhound({
        name: 'users',
        local: datums,
        datumTokenizer: function(d) {
          return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace
      });

      this.searchEngine = engine;
      engine.initialize();
    },

    displaySearch: function(query) {
      $('#tagInsert').empty();
      this.searchEngine.get(query, function(res) {
        res.forEach(function(item) {
          $('#tagInsert').append('<div class="tagInsertItem mention-choice" data-id="' + item.id + '" data-name="' + item.name + '"><img src="' + item.avatar + '"/>'  + item.name + '</div>');
        });
      });
    }
  });
});
