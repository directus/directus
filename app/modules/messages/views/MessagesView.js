define([
  'app',
  'backbone',
  'core/BasePageView'
],

function(app, Backbone, BasePageView) {

  return BasePageView.extend({

    events: {
      'click #btn-top': function() {
        app.router.go('#messages','new');
      }
    },

    serialize: function() {
      return {
        title: 'Messages',
        buttonTitle: 'Compose'
      };
    },

    beforeRender: function() {
      var view = new ListView({collection: this.collection});
      this.setView('#page-content', view);

      //this.collection.fetch();
    }
  });
}