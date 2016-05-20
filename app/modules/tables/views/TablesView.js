define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView'
],

function(app, Backbone, Directus, BasePageView) {

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: "Tables"
      }
    },

    beforeRender: function() {
      this.setView('#page-content', new Directus.TableSimple({
        collection: this.collection,
        tagName: 'div',
        attributes: {
          'class': 'table-shadow'
        },
        template: 'modules/tables/tables'
      }));
      BasePageView.prototype.beforeRender.call(this);
    }

  });

});
