define([
  'app',
  'backbone',
  'core/BasePageView'
],
function(app, Backbone, BasePageView) {

  return BasePageView.extend({

    serialize: function() {
      return {title: this.model.get('subject'), breadcrumbs: [{title: 'Messages', anchor: '#messages'}]};
    },

    afterRender: function() {
      var readView = new ReadView({model: this.model});
      this.setView('#page-content', readView);
      if (this.model.has('message')) {
        readView.render();
      }
    }
  });
}