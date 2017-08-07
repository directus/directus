define(['core/extensions'], function (Extension) {

  var PageTwoContainerView = Extension.View.extend({
    template: 'example/templates/page2'
  });

  return Extension.BasePageView.extend({
    headerOptions: {
      route: {
        breadcrumbs: [{
          title: 'Example Extension',
          anchor: 'ext/example'
        }, {
          title: 'Page Two',
          anchor: 'ext/example/pagetwo'
        }]
      },

      leftToolbar: false,
      rightToolbar: false
    },

    beforeRender: function () {
      this.setView('#page-content', this.pageTwoView);
    },

    initialize: function() {
      this.pageTwoView = new PageTwoContainerView();
    }
  });
});
