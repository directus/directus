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

    updateFrequency: 2000,

    updateMessages: function() {
      var data = {
        'maxId': 10
      };

      this.fetch({data: data, remove: false});
      //console.log(this, 'looking for msgs');
    },

    startPolling: function(ms) {
      window.setInterval(this.updateMessages.bind(this), this.updateFrequency);
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

        var attrs = {
          'from': app.getCurrentUser().get('id'),
          'subject': '',
          'recepients': '0_7',
          'datetime': (new Date()).toISOString(),
          'response_to': this.model.id,
          'message': $('#messages-response').val(),
          'responses': []
        };

        var model = new Model(attrs, {collection: collection, parse: true, url: app.API_URL + 'messages/rows/'});
        model.save();
        collection.add(model);
      }
    },

    serialize: function() {
      console.log(this.model.toJSON());
      return this.model.toJSON()
    },

    initialize: function() {
      this.model.on('sync', this.render, this);
      this.model.get('responses').on('add', this.render, this);
    }

  });


  Messages.Views.Read = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      return {title: this.model.get('subject'), breadcrumbs: [{title: 'Messages', anchor: '#messages'}]};
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
        this.model.save(this.editView.data(), {success: function() {
          app.router.go('#messages');
        }});

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

    afterRender: function() {
      var view = new Directus.Table({collection: this.collection, navigate: true, hideColumnPreferences: true});
      this.setView('#page-content', view);
      this.collection.fetch();
    }

  });

  return Messages;

});