define([
  'app',
  'underscore',
  'backbone',
  'core/directus',
  'core/BasePageView',
  'core/t',
  'modules/tables/views/EditViewRightPane',
  'core/widgets/widgets'
], function(app, _, Backbone, Directus, BasePageView, __t, EditViewRightPane, Widgets) {

  'use strict';

  return BasePageView.extend({

    headerOptions: {
      route: {
        title: __t('edit_user'),
        breadcrumbs: [{ title: __t('users'), anchor: '#users'}]
      }
    },

    saveConfirm: function (event) {
      this.save(event);
    },

    save: function (event) {
      var action = 'save-form-leave';
      var data =  $('form').serializeObject();
      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;

      if (event.target.options !== undefined) {
        action = $(event.target.options[event.target.selectedIndex]).val();
      }

      if (action === 'save-form-stay') {
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          route.push(model.get('id'));
          app.router.go(route);
        };
      } else {
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          if (action === 'save-form-add') {
            // Trick the router to refresh this page when we are dealing with new items
            if (isNew) app.router.navigate("#", {trigger: false, replace: true});
            route.push('new');
          }
          app.router.go(route);
        };
      }

      if (action === 'save-form-copy') {
        var clone = model.toJSON();
        delete clone.id;
        model = new collection.model(clone, {collection: collection, parse: true});
        collection.add(model);
      }

      // hotfix: if password is empty omit
      if (!data.password) {
        delete data.password;
      }

      // patch only the changed values
      model.save(model.diff(data), {
        success: success,
        error: function(model, xhr, options) {
          console.error('err');
        },
        wait: true,
        patch: true,
        includeRelationships: true
      });
    },

    leftToolbar: function() {
      var collection = this.model.collection;
      var canAdd = this.model.isNew() && collection.canAdd();
      var canEdit = !this.model.isNew() && collection.canEdit();
      var editView = this;

      if (!canAdd && !canEdit) {
        return;
      }

      this.saveWidget = new Widgets.SaveWidget({
        widgetOptions: {
          basicSave: this.headerOptions.basicSave
        },
        onClick: _.bind(this.saveConfirm, this)
      });

      this.saveWidget.enable();

      this.infoWidget = new Widgets.InfoButtonWidget({
        onClick: function (event) {
          editView.toggleRightPane();
        }
      });

      return [
        this.saveWidget,
        this.infoWidget
      ];
    },

    rightPane: function() {
      return EditViewRightPane;
    },

    afterRender: function () {
      var editView = this.editView;

      this.setView('#page-content', editView);
      if (!this.model.isNew()) {
        this.model.fetch();
      } else {
        editView.render();
      }
    },

    initialize: function () {
      this.editView = new Directus.EditView({model: this.model});
      this.headerOptions.route.title = (this.model.id) ? this.model.get('first_name') + ' ' + this.model.get('last_name') : __t('new_user');
    }
  });
});
