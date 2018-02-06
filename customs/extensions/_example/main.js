define([
  'app',
  'core/extensions',
  './views/main',
  './views/example',
  './views/pageone',
  './views/pagetwo'
], function (app, Extension, MainView, ExampleView, PageOneView, PageTwoView) {
  var ext = {
    id: 'example_extension',
    icon: 'icon-folder',
    title: 'Example Extension'
  };

  ext.Router = Extension.Router.extend({
    routes: {
      "(/)":         "index",
      "/pageone":    "pageOne",
      "/pagetwo":    "pageTwo"
    },

    getMainView: function () {
      if (!this.mainView) {
        this.mainView = new MainView();
      }

      app.router.v.main.setView('#content', this.mainView);

      return this.mainView;
    },

    setPage: function (view) {
      this.getMainView().getPage().setView('#example-extension-view', view);
    },

    index: function () {
      this.setPage(new ExampleView());
      app.router.v.main.render();
    },

    pageOne: function () {
      this.setPage(new PageOneView());
      app.router.v.main.render();
    },

    pageTwo: function () {
      this.setPage(new PageTwoView());
      app.router.v.main.render();
    },

    initialize: function () {
      //
    }
  });

  return ext;
});
