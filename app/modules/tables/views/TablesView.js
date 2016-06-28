define([
  'app',
  'backbone',
  'core/directus',
  'core/t',
  'core/BasePageView'
],

function(app, Backbone, Directus, __t, BasePageView) {

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: __t('tables')
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
