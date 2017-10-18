define([
  'app',
  'backbone',
  'core/directus',
  'core/t',
  'core/BasePageView',
  'core/widgets/widgets',
  'modules/settings/views/modals/table-new'
],

function(app, Backbone, Directus, __t, BasePageView, Widgets, TableNewModal) {

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: __t('tables')
      }
    },

    leftToolbar: function() {
      var widgets = [];

      if (app.user.isAdmin()) {
        widgets.push(new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'addBtn',
            iconClass: 'add',
            buttonClass: 'primary',
            buttonText: __t('new_item')
          },
          onClick: function (event) {
            app.router.openViewInModal(new TableNewModal());
          }
        }));
      }

      return widgets;
    },

    beforeRender: function() {
      this.setView('#page-content', new Directus.TableSimple({
        collection: this.collection,
        tagName: 'div',
        template: 'modules/tables/tables',
        columns: ['table_name']
      }));
      BasePageView.prototype.beforeRender.call(this);
    }

  });

});
