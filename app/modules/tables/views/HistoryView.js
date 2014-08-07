define([
  'app',
  'backbone',
  'core/directus',
],

function(app, Backbone, Directus) {

  return Backbone.Layout.extend({
    tagName: "ul",

    attributes: {
      class: "group-list"
    },

    template: "modules/activity/activity-history",

    events: {
      'click #messages-response-button': function(e) {
        if(this.$el.find('#commentTextarea').val() === "") {
          return;
        }

        var model = new app.messages.model({from: app.authenticatedUserId.id}, {collection: this.comments, parse: true});
        var subject = "Item " + this.model.get('id') + " from " + app.capitalize(this.model.collection.table.id);

        var date = new Date();
        model.set({datetime: date, subject: subject, message:this.$el.find('#commentTextarea').val(), comment_metadata: this.model.collection.table.id + ":" + this.model.get('id')})
        model.unset("responses");

        this.listenToOnce(model, 'sync', function(e) {
          this.comments.add(model);
          this.render();
        });
        this.$el.find('#messages-response-button').prop('disabled', true);
        model.save();
      },
      'click .history-follow': function(e) {
        console.log(app.users.getCurrentUser());
        /*var data = {};
        data[attr] = !tableModel.get(attr);
        tableModel.save(data);
        if(element.hasClass('add-color')) {
          element.addClass('delete-color');
          element.removeClass('add-color');
          element.html('✕');
        } else {
          element.addClass('add-color');
          element.removeClass('delete-color');
          element.html('◯');
        }*/
      },
      'click .view-entire-history': function(e) {
        $('.history-container li.hide').removeClass('hide');
        $('.view-entire-history').remove();
        //$(e.target).remove();
      }
    },

    initialize: function(options) {
      //Get Activity
      this.model = options.model;
      this.activity = app.activity;
      this.comments = new Directus.EntriesCollection({}, {table: app.messages.table, structure: app.messages.structure});

      if(!this.model.isNew()) {
        this.activity.setFilter({adv_search: 'table_name = "' + this.model.collection.table.id + '" AND row_id = ' + this.model.get('id')});
        this.activity.fetch();
        this.comments.setFilter({adv_where: 'comment_metadata = "' + this.model.collection.table.id + ":" + this.model.get('id') + '"'});
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
    },
    serialize: function() {
      var data = this.activity.map(function(model) {
        var data = {
          "table": model.get('table_name'),
          'time': moment(model.get('datetime')).fromNow(),
          "timestamp": model.get('datetime'),
          "user_avatar": model.get('user')
        };

        switch(model.get('action')) {
          case 'DELETE':
            data.icon = "icon-trash";
            data.color = "delete";
            data.action_text = "deleted this item";
            break;
          case 'UPDATE':
            data.icon = "icon-pencil";
            data.color = "edit";
            data.action_text = "edited this item";
            break;
          case 'ADD':
            data.add = true;
            data.icon = "icon-check";
            data.color = "add";
            data.action_text = "created this item";
            break;
        }
        return data;
      });

      var comments = this.comments.map(function(model) {
        var date = new Date(model.get('datetime') + ' UTC');

        var data = {
          "table": "Comment",
          "timestamp": date,
          "time": moment(date).fromNow(),
          "user_avatar": model.get('from')
        };

        data.isComment = true;
        data.title = model.get("message");

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
        }
      }

      var preview = (data.length > 5)? true : false;
      var additionalCount = data.length - 5;

      return {activities: data, preview: preview, additionalCount: additionalCount, current_user: app.authenticatedUserId};
    }
  });
});