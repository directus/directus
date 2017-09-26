define([
  'app',
  'underscore',
  'backbone',
  'core/directus',
  'core/BasePageView',
  'core/notification',
  'core/t',
  'modules/tables/views/EditViewRightPane',
  'core/widgets/widgets'
], function(app, _, Backbone, Directus, BasePageView, Notification, __t, EditViewRightPane, Widgets) {

  'use strict';

  // TODO: Extend this view from EditView
  // EditUserView is a lot similar to EditView
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
      var self = this;
      var action = 'save-form-leave';
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
          self.model.disablePrompt();
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
          self.model.disablePrompt();
          app.router.go(route);
        };
      }

      if (action === 'save-form-copy') {
        var clone = model.toJSON();
        delete clone.id;
        model = new collection.model(clone, {collection: collection, parse: true});
        collection.add(model);
      }

      if (!model.unsavedAttributes()) {
        Notification.warning('Nothing changed, nothing saved');

        // Write this as a helper function
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);

        return;
      }

      // Patch only the changed values if it's not new
      model.save(this.model.getChanges(false), {
        success: success,
        error: function (model, xhr, options) {
          console.error('err');
        },
        wait: true,
        patch: !model.isNew(),
        validateAttributes: !model.isNew(),
        includeRelationships: true
      });
    },

    leftToolbar: function() {
      var widgets = [];
      var collection = this.model.collection;
      var isNew = this.model.isNew();
      var canAdd = isNew && collection.canAdd();
      var canEdit = !isNew && collection.canEdit();
      var editView = this;

      if (!canAdd && !canEdit) {
        return;
      }

      this.saveWidget = new Widgets.SaveWidget({
        widgetOptions: {
          basicSave: this.headerOptions.basicSave
        },
        enabled: isNew && this.model.canEdit(),
        onClick: _.bind(this.saveConfirm, this)
      });

      if (this.model.canEdit() && !isNew) {
        editView.saveWidget.setEnabled(true);
        // this.model.on('unsavedChanges', function (hasChanges, unsavedAttrs, model) {
        //   editView.saveWidget.setEnabled(hasChanges);
        // });
      }

      widgets.push(this.saveWidget);

      this.deleteWidget = new Widgets.ButtonWidget({
        widgetOptions: {
          buttonId: 'deleteBtn',
          iconClass: 'close',
          buttonClass: 'serious',
          buttonText: __t('delete')
        },
        onClick: _.bind(editView.deleteConfirm, this)
      });

      widgets.push(this.deleteWidget);

      this.infoWidget = new Widgets.InfoButtonWidget({
        enable: !this.model.isNew(),
        onClick: function (event) {
          editView.toggleRightPane();
        }
      });

      widgets.push(this.infoWidget);

      return widgets;
    },

    rightPane: function() {
      return EditViewRightPane;
    },

    afterRender: function () {
      var editView = this.editView;

      this.setView('#page-content', editView);
      if (this.model.isNew()) {
        editView.render();
      }
    },

    deleteConfirm: function(status) {
      var editView = this;

      app.router.openModal({type: 'confirm', text: __t('confirm_delete_item'), callback: function () {
        var xhr = editView.model.destroy();

        if(!xhr) {
          return;
        }

        app.router.go('/users/');
      }});
    },

    initialize: function (options) {
      this.editView = new Directus.EditView({model: this.model});

      app.checkUserEditingConflict();

      if (!this.model.isTracking()) {
        this.model.startTracking();
      }

      if (options.warnOnExit === true) {
        this.model.enablePrompt();
      }

      this.headerOptions.route.title = (this.model.id) ? this.model.get('first_name') + ' ' + this.model.get('last_name') : __t('new_user');
    }
  });
});
