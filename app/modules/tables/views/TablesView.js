define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView'
],

function(app, Backbone, Directus, BasePageView) {
  
  return BasePageView.extend({

    serialize: {title: 'Tables'},

    beforeRender: function() {
      this.setView('#page-content', new Directus.TableSimple({collection: this.collection, template: 'tables'}));
    }

  });

});