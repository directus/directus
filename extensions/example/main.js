define([
  'app',
  'backbone',
  'core/directus',
],

function(app, Backbone, Directus) {

  var Extension = {
    id: 'reporting'
  };

  Extension.Collection = Backbone.Collection.extend({
    initialize: function() {
      this.url = app.API_URL + 'extensions/' + Extension.id;
    }
  });

  //var products = app.entries['products'];

  var MainView = Backbone.Layout.extend({

    prefix: 'extensions/example/templates/',

    serialize: function() {
      return {symbols: this.collection.toJSON()};
    },

    template: 'example',

    initialize: function() {
      this.collection.on('reset', this.render, this);
    }

  });

  var View = Backbone.Layout.extend({

    template: 'page',

    el: '#content',

    serialize: function() {
      return {title: 'Example Module', sidebar: false};
    },

    afterRender: function() {
      this.setView('#page-content', new MainView({collection: this.collection}));
      this.collection.fetch();
    },

    initialize: function() {

    }

  });

  Extension.Router = Directus.SubRoute.extend({
    routes: {
      "":         "index",
      "add":      "add"
    },

    index: function() {
      this.main = new View({collection: new Extension.Collection()});
      this.main.render();
    },

    add: function() {
      console.log('add');
    },

    initialize: function() {

    }

  });


  return Extension;
});