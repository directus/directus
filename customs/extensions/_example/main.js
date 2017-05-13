define([
  'app',
  'core/extensions',
  'backbone',
  'moment'
], function (app, Extension, Backbone, moment) {
  var ext = {
    id: 'example_extension',
    icon: 'icon-folder',
    title: 'Example Extension'
  };

  var Model = Backbone.Model.extend({
    url: '/api/extensions/example/time'
  });

  var ExampleContainerView = Extension.View.extend({
    template: 'example/templates/example',

    serialize: function () {
      return {
        datetime: moment(this.model.get('datetime')).format('YY-MM-DD hh:mm:ss')
      }
    },

    initialize: function () {
      this.listenTo(this.model, 'sync', this.render);

      this.model.fetch();
    }
  });

  var ExamplePageView = Extension.BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Example Extension'
      },
      leftToolbar: false,
      rightToolbar: false
    },

    beforeRender: function () {
      this.setView('#page-content', this.exampleView);
    },

    initialize: function() {
      this.exampleView = new ExampleContainerView({
        model: new Model()
      });
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
