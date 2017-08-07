define(['core/extensions'], function (Extension) {

  var PageOneContainerView = Extension.View.extend({
    template: 'example/templates/page1'
  });

  return Extension.BasePageView.extend({
    headerOptions: {
      route: {
        breadcrumbs: [{
          title: 'Example Extension',
          anchor: 'ext/example'
        }, {
          title: 'Page One',
          anchor: 'ext/example/pageone'
        }]
      },

      leftToolbar: false,
      rightToolbar: false
    },

    beforeRender: function () {
      this.setView('#page-content', this.pageOneView);
    },

    initialize: function() {
      this.pageOneView = new PageOneContainerView();
    }
  });
});
