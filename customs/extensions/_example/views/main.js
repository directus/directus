define(['core/extensions'], function (Extension) {
  var MainContainerView = Extension.View.extend({
    template: 'example/templates/container'
  });

  return Extension.BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Example Extension'
      },
      leftToolbar: false,
      rightToolbar: false
    },

    beforeRender: function () {
      this.setView('#page-content', this.page);
    },

    getPage: function () {
      return this.page
    },

    initialize: function () {
      this.page = new MainContainerView()
    }
  });
});
