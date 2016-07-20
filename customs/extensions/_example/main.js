define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView'
],

function(app, Backbone, Directus, BasePageView) {

  var Extension = {
    id: 'example_extension',
    icon: 'icon-folder',
    title: 'Example Extension'
  };

  var ExampleContainerView = Backbone.Layout.extend({
    prefix: 'extensions/example/templates/',
    template: 'example',
  });

  var View = BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Example Extension',
      },
      leftToolbar: false,
      rightToolbar: false
    },

    afterRender: function() {
      this.setView('#page-content', this.exampleView);
      this.exampleView.render();
    },
    initialize: function(options) {
      this.exampleView = new ExampleContainerView();
    }
  });

  Extension.Router = Directus.SubRoute.extend({
    routes: {
      "(/)":         "index"
    },

    index: function() {
      this.view = new View({model: this.model});
      app.router.v.main.setView('#content', this.view);
      app.router.v.main.render();
    },

    initialize: function() {
    }

  });


  return Extension;
});
