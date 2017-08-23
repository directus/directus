define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'core/directus',
  'core/notification',
  'core/BasePageView',
  'modules/files/views/EditFilesViewRightPane',
  'core/widgets/widgets'
],

function(app, _, Backbone, __t, Directus, Notification, BasePageView, RightPane, Widgets) {

  'use strict';

  // TODO: Extend this view from EditView
  // EditFilesView is a lot similar to EditView
  return BasePageView.extend({

    deleteConfirm: function () {
      var self = this;

      if (!app.user.canUploadFiles()) {
        return;
      }

      app.router.openModal({type: 'confirm', text: __t('confirm_delete_item'), callback: function () {
        // var xhr = self.model.saveWithDeleteStatus();
        // NOTE: force delete files
        // TODO: Add global option to set whether to soft or hard delete files
        var xhr = self.model.destroy({wait: true});

        xhr.then(function () {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          app.router.go(route);
        });
      }});
    },

    saveConfirm: function (event) {
      if (!app.user.canUploadFiles()) {
        return;
      }

      this.save(event);
    },

    save: function (event) {
      var self = this;
      var action = 'save-form-leave';
      if (event.target.options !== undefined) {
        action = $(event.target.options[event.target.selectedIndex]).val();
      }

      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;

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
        wait: true,
        patch: !model.isNew(),
        validateAttributes: !model.isNew(),
        includeRelationships: true
      });
    },

    afterRender: function () {
      var self = this;

      this.setView('#page-content', this.editView);

      //Fetch Model if Exists
      if (this.model.has('id')) {
        this.model.fetch({
          dontTrackChanges: true,
          error: function(model, XMLHttpRequest) {
            //If Cant Find Model Then Open New Entry Page
            if (404 === XMLHttpRequest.status) {
              var route = Backbone.history.fragment.split('/');
              route.pop();
              route.push('new');
              self.model.disablePrompt();
              app.router.go(route);
            }
          }
        });
      } else {
        this.editView.render();
      }
    },

    leftToolbar: function () {
      var canUploadFiles = app.user.canUploadFiles();
      var canAdd = this.model.collection.canAdd();
      var canEdit = this.model.collection.canEdit();
      var widgets = [];
      var isNew = this.model.isNew();
      var editView = this;

      this.saveWidget = new Widgets.SaveWidget({
        widgetOptions: {
          basicSave: this.headerOptions.basicSave,
          singlePage: this.single
        },
        enabled: isNew && canAdd && canUploadFiles,
        onClick: _.bind(editView.saveConfirm, editView)
      });

      widgets.push(this.saveWidget);

      if (canUploadFiles && canEdit && !isNew) {
        editView.saveWidget.setEnabled(true);
        // this.model.on('unsavedChanges', function (hasChanges, unsavedAttrs, model) {
        //   editView.saveWidget.setEnabled(hasChanges);
        // });
      }

      // delete button
      if (!this.model.isNew()) {
        this.deleteWidget = new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'deleteBtn',
            iconClass: 'close',
            buttonClass: canUploadFiles ? 'serious' : 'disabled',
            buttonText: __t('delete')
          },
          onClick: _.bind(editView.deleteConfirm, editView)
        });

        widgets.push(this.deleteWidget);
      }

      this.infoWidget = new Widgets.InfoButtonWidget({
        enable: !this.model.isNew(),
        onClick: function (event) {
          editView.toggleRightPane();
        }
      });

      widgets.push(this.infoWidget);

      return widgets;
    },

    headerOptions: {
      route: {
        title: __t('edit_file'),
        breadcrumbs: [{ title: __t('files'), anchor: '#files'}],
        isOverlay: false
      },
      basicSave: false,
    },

    rightPane: function() {
      return RightPane;
    },

    initialize: function (options) {
      this.editView = new Directus.EditView({model: this.model, ui: this.options.ui});
      this.headerOptions.route.title = this.model.isNew() ? __t('uploading_new_file') : __t('editing_file');
      this.collection = app.files;

      app.checkUserEditingConflict();

      if (!this.model.isTracking()) {
        this.model.startTracking();
      }

      if (options.warnOnExit === true) {
        this.model.enablePrompt();
      }
    }
  });
});
