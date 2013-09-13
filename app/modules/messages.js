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
  'core/entries/entries.collection'
],

function(app, Backbone, Directus, SaveModule, EntriesCollection) {

  var Messages = app.module();

  Messages.Collection = EntriesCollection.extend({

    updateFrequency: 10000,

    updateMessages: function() {
      var data = {
        'max_id': this.maxId
      };

      this.fetch({data: data, remove: false});
    },

    startPolling: function(ms) {
      window.setInterval(this.updateMessages.bind(this), this.updateFrequency);
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

    template: 'messages-reading',

    events: {
      'click #messages-response-button': function() {
        var collection = this.model.get('responses');
        var Model = collection.model;
        var recepients = _.map(this.model.get('recepients').split(','), function(id) { return '0_'+id; });
        var myId = app.getCurrentUser().get('id');

        recepients.push('0_'+this.model.get('from'));

        var attrs = {
          'from': app.getCurrentUser().get('id'),
          'subject': '',
          'recepients': recepients.join(','),
          'datetime': (new Date()).toISOString(),
          'response_to': this.model.id,
          'message': $('#messages-response').val(),
          'responses': []
        };

        var model = new Model(attrs, {collection: collection, parse: true, url: app.API_URL + 'messages/rows/'});
        model.save();
        collection.add(model);
        this.render();
      }
    },

    serialize: function() {
      var data = this.model.toJSON();
      data.recepients = data.recepients.split(',');
      data.message = new Handlebars.SafeString(app.replaceAll('\n', '<br>', data.message));
      return data;
    },

    initialize: function() {
      this.model.on('sync change', this.render, this);
      //this.model.get('responses').setOrder('id', 'ASC');
      this.model.save({read: 1}, {patch: true, silent: true});
    }

  });

  var ListView = Backbone.Layout.extend({

    template: 'messages-list',

    events: {
      'click tr': function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        app.router.go('#messages', id);
      }
    },

    serialize: function() {
      var data = this.collection.map(function(model) {
        var data = model.toJSON();
        data.read = (data.read === '1');
        data.responsesLength = data.responses.length;
        data.from = parseInt(data.from, 10);
        //console.log(_.map(data.responses, 'from'));
        return data;
      });
      return {messages: data};
    },

    initialize: function() {
      this.collection.on('sync', this.render, this);
    }

  });


  Messages.Views.Read = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      return {title: 'Reading Message', breadcrumbs: [{title: 'Messages', anchor: '#messages'}]};
    },

    beforeRender: function() {
      //this.setView('#sidebar', new SaveModule({model: this.model, buttonText: 'Send Message', single: true}));
    },

    afterRender: function() {
      var readView = new ReadView({model: this.model});
      this.setView('#page-content', readView);
      if (this.model.has('message')) {
        readView.render();
      }
      //this.editView = new Directus.EditView({model: this.model});
      //this.setView('#page-content', this.editView);
      //this.editView.render();
    }

  });

  Messages.Views.New = Backbone.Layout.extend({

    template: 'page',

    events: {
      'click #save-form': function(e) {
        var data = this.editView.data();
        this.model.save(data, {success: function() {
          app.router.go('#messages');
        }});

        this.model.collection.add(this.model);
      }
    },

    serialize: function() {
      var title = 'Compose';
      return {title: title, sidebar: true, breadcrumbs: [{ title: 'Messages', anchor: '#messages'}]};
    },

    beforeRender: function() {
      this.setView('#sidebar', new SaveModule({model: this.model, buttonText: 'Send Message', single: true}));
    },

    afterRender: function() {
      this.editView = new Directus.EditView({model: this.model});
      this.setView('#page-content', this.editView);
      this.editView.render();
    }

  });

  Messages.Views.List = Backbone.Layout.extend({

    template: 'page',

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