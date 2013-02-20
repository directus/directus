define([
  'app',
  'backbone',
  'core/directus',
],

function(app, Backbone, Directus) {

  var iAmPrivate = 9999999;

  // Private view
  var TestView = Backbone.Layout.extend({

    prefix: 'extensions/example/templates/',

    template: 'example'

  });

  var Sidebar = Backbone.Layout.extend({

    prefix: 'extensions/example/templates/',

    template: 'sidebar',

    serialize: function() {
      return {rows: this.collection.toJSON()};
    },

    initialize: function() {
      this.collection.on('reset', this.render, this);
    }

  });

  var Extension = {

    id: 'example',

    routes: {
      ':id': function(id) {
      }
    },

    View: Backbone.Layout.extend({

      template: 'page',

      serialize: function() {
        return {title: 'Example Module', sidebar: true};
      },

      beforeRender: function() {
        this.setView('#page-content', new TestView());
      },

      afterRender: function() {
        this.insertView('#sidebar', new Sidebar({collection: this.collection}));
        this.collection.fetch();
      },

      initialize: function() {
        var url = app.API_URL + 'extensions/' + Extension.id;

        var customCollection = Backbone.Collection.extend({
          url: url
        });

        var c = new customCollection();

        c.on('reset', function() {
          console.log(c.toJSON());
        });

        c.fetch();



        this.collection = app.entries['products'];
      }

    })
  };

  return Extension;
});