//  messages.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/directus',
  'core/panes/pane.saveview',
  'core/entries/EntriesCollection',
  'core/entries/EntriesModel',
  'core/BasePageView',
  'moment'
],

function(app, Backbone, Directus, SaveModule, EntriesCollection, EntriesModel, BasePageView, moment) {

  "use strict";

  var Messages = app.module();

  Messages.Model = EntriesModel.extend({

    getUnreadCount: function() {
      var unread = this.get('read') == 1 ? 0 : 1;

      var unreadResponses = this.get('responses').reduce(function(memo, model){
        var unread = model.get('read') == 1 ? 0 : 1;
        return memo + unread;
      }, 0);

      return unread + unreadResponses;
    },

    markAsRead: function(options) {
      options = options || {};

      var unreadCount = this.getUnreadCount();

      // Do nothing if model is allready read
      if (unreadCount === 0) {
        return;
      }

      // Decrease unread counter
      this.collection.unread -= unreadCount;

      if (options.save) {
        return this.save({read: 1}, {patch: true, silent: true});
      }

      return this.set({read: "1"}, {silent: true});
    }

  });

  Messages.Collection = EntriesCollection.extend({

    model: Messages.Model,

    updateFrequency: 10000,

    filters: {columns_visible: ['from','subject','date_updated'], sort: 'date_updated', sort_order: 'DESC'},

    updateMessages: function() {
      var that = this;
      var data = {
        'max_id': this.maxId
      };

      this.fetch({data: data, remove: false, global: false, error: function(collection, response, options) {
        that.trigger('error:polling');
        that.stopPolling();
      }});

    },

    startPolling: function(ms) {
      this.timerId = window.setInterval(this.updateMessages.bind(this), this.updateFrequency);
    },

    stopPolling: function(ms) {
      clearInterval(this.timerId);
      window.setTimeout(this.startPolling.bind(this), 30000);
    },

    parse: function(response) {
      if (response === null) return [];

      if (response.max_id !== undefined) {
        this.maxId = response.max_id;
        this.unread = response.unread;
        this.total = response.total;
      }

      return response.rows;
    },

    // Restore fetch to default style
    fetch: function(options) {
      this.trigger('fetch', this);
      EntriesCollection.prototype.fetch.call(this, options);
    }

  });

  var ReadView = Backbone.Layout.extend({

    maxRecipients: 10,

    template: 'modules/messages/messages-reading',

    events: {
      'click #messages-response-button': function() {
        var collection = this.model.get('responses');
        var Model = collection.model;
        var myId = app.users.getCurrentUser().get('id');
        var recipients = _.map(this.model.get('recipients').split(','), function(id) {
          return '0_' + id;
        });

        recipients.push('0_'+this.model.get('from'));

        var attrs = {
          'from': app.users.getCurrentUser().get('id'),
          'subject': '',
          'recipients': recipients.join(','),
          'datetime': (new Date()).toISOString(),
          'response_to': this.model.id,
          'message': $('#messages-response').val(),
          'responses': []
        };

        var model = new Model(attrs, {
          collection: collection,
          parse: true,
          url: app.API_URL + 'messages/rows/'
        });

        model.save();
        collection.add(model);
        this.render();
      },
      'click #messages-show-recipients': function() {
        var $el = $('#messages-recipients');
        $el.toggle();
      }
    },

    serialize: function() {
      var data = this.model.toJSON();
      data.recipients = data.recipients.split(',');
      data.recipientsCount = data.recipients.length;
      data.collapseRecipients = data.recipients.length > this.maxRecipients;

      data.message = new Handlebars.SafeString(app.replaceAll('\n', '<br>', data.message));
      return data;
    },

    initialize: function() {
      this.model.on('change:read', function() {
        this.model.markAsRead({save: true});
        this.render();
      }, this);
      this.model.markAsRead({save: true});
    }

  });

  var ListView = Backbone.Layout.extend({

    template: 'modules/messages/messages-list',

    events: {
      'click tr': function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        app.router.go('#messages', id);
      }
    },

    serialize: function() {
      var data = this.collection.map(function(model) {
        var data = model.toJSON();
        var momentDate = moment(data.date_updated);
        data.timestamp = parseInt(momentDate.format('X'), 10);
        data.niceDate = momentDate.fromNow();
        data.read = model.getUnreadCount() === 0;
        data.responsesLength = data.responses.length;
        data.from = parseInt(data.from, 10);
        //console.log(_.map(data.responses, 'from'));
        return data;
      });

      // Order the data by timestamp
      data = _.sortBy(data, function(item) {
        return -item.timestamp;
      });

      return {messages: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });


  Messages.Views.Read = BasePageView.extend({

    serialize: function() {
      return {title: this.model.get('subject'), breadcrumbs: [{title: 'Messages', anchor: '#messages'}]};
    },

    afterRender: function() {
      var readView = new ReadView({model: this.model});
      this.setView('#page-content', readView);
      if (this.model.has('message')) {
        readView.render();
      }
    }

  });

  Messages.Views.New = BasePageView.extend({

    events: {
      'click #save-form': function(e) {
        var data = this.editView.data();

        data.read = "1";
        data.date_updated = new Date();

        this.model.save(data, {success: function() {
          app.router.go('#messages');
        }});

        this.model.collection.add(this.model);
      },
      'click #save-form-cancel': function() {
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);
      }
    },

    serialize: function() {
      return {
        title: 'Compose',
        sidebar: true,
        breadcrumbs: [{ title: 'Messages', anchor: '#messages'}]
      };
    },

    beforeRender: function() {
      this.setView('#sidebar', new SaveModule({
        model: this.model,
        buttonText: 'Send Message',
        single: true
      }));
    },

    afterRender: function() {
      this.editView = new Directus.EditView({model: this.model});
      this.setView('#page-content', this.editView);
      this.editView.render();
    }

  });

  Messages.Views.List = BasePageView.extend({

    events: {
      'click #btn-top': function() {
        app.router.go('#messages','new');
      }
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

      //this.collection.fetch();
    }

  });

  return Messages;

});