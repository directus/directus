define(['app', 'core/extensions'], function(app, Extension) {
  var ext = {
    id: 'example_extension',
    icon: 'icon-folder',
    title: 'Example Extension'
  };

  var ExampleContainerView = Extension.View.extend({
    template: 'example/templates/example'
  });

  var ExamplePageView = Extension.BasePageView.extend({
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

    initialize: function() {
      this.exampleView = new ExampleContainerView();
    }
  });

  ext.Router = Extension.Router.extend({
    routes: {
      "(/)":         "index"
    },

    index: function() {
      this.view = new ExamplePageView({model: this.model});
      app.router.v.main.setView('#content', this.view);
      app.router.v.main.render();
    },

    initialize: function() {
    }
  });


  return ext;
});
