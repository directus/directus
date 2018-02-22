define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'core/t',
  'core/notification',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets',
  'modules/tables/views/EditViewRightPane',
  'modules/tables/views/TranslationView'
], function (app, Backbone, _, Handlebars, __t, Notification, Directus, BasePageView, Widgets, EditViewRightPane, TranslationView) {

  'use strict';

  var EditView = Backbone.Layout.extend({
    template: Handlebars.compile('<div id="editFormEntry"></div><div id="translateFormEntry">'),

    afterRender: function () {
      this.insertView('#editFormEntry', this.editView);

      if (this.translateViews.length) {
        _.each(this.translateViews, function(view) {
          this.insertView('#translateFormEntry', view);
        }, this);
      }

      var self = this;
      this.editView.on('afterRender', function () {
        self.stickit();
      });

      if (this.skipFetch || this.model.isNew()) {
        this.editView.render();
      }
    },

    cleanup: function () {
      this.unstickit();
    },

    beforeSaveHook: function () {
      if (this.translateViews.length) {
        _.each(this.translateViews, function (view) {
          this.model.set(view.translateId, view.translateCollection);
        }, this);
      }
    },

    data: function () {
      return this.editView.data();
    },

    initialize: function (options) {
      this.skipFetch = options.skipFetch;
      this.translateViews = [];

      options.hiddenFields = options.hiddenFields || [];
      options.model.structure.each(function(model) {
        if (model.get('ui') === 'translation') {
          var translateId = model.id;
          options.hiddenFields.push(translateId);
          var view = new TranslationView({
            model: options.model,
            translateId: translateId,
            translateSettings: model.options.attributes,
            translateRelationship: model.relationship.attributes
          });

          this.translateViews.push(view);
        }
      }, this);

      this.editView = new Directus.EditView(options);
    },
    serialize: function () {
      return {};
    }
  });

  return BasePageView.extend({
    events: {
      'submit': function (event) {
        // prevent user submit the form using Enter key
        // TODO: handle this event to or as 'saveConfirm'
        event.preventDefault();
      }
    },

    getHeaderOptions: function () {
      return {
        route: {
          isOverlay: false
        }
      };
    },

    saveConfirm: function (event) {
      this.save(event);
    },

    deleteConfirm: function () {
      var self = this;

      app.router.openModal({type: 'confirm', text: __t('confirm_delete_item'), callback: function () {
        var xhr = self.model.saveWithDeleteStatus();

        // when there's a failed validation
        // the function returns false instead of a promise
        if (!xhr) {
          return;
        }

        xhr.done(function () {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          app.router.go(route);
        });
      }});
    },

    save: function (event) {
      this.editView.beforeSaveHook();

      var self = this;
      var action = this.single ? 'save-form-stay' : 'save-form-leave';
      if (event.target.options !== undefined && !this.single) {
        action = $(event.target.options[event.target.selectedIndex]).val();
      }

      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;
      var goToNewItem = function () {
        var route = Backbone.history.fragment.split('/');

        // Trick the router to refresh this page when we are dealing with new items
        if (isNew) {
          app.router.navigate('#', {trigger: false, replace: true});
        }

        route.pop();
        route.push('new');
        app.router.go(route);
      };
      var notifyParent = function () {
        _.each(app.getCorsTargets(), function (origin) {
          window.parent.postMessage('item.saved', origin);
        });
      };

      if (action === 'save-form-stay') {
        success = function (model, response, options) {
          if (self.onSuccess) {
            self.onSuccess(model, response, options);
          }

          notifyParent();

          var route = Backbone.history.fragment.split('/');
          if (!model.table.get('single')) {
            route.pop();
            route.push(model.id);
            model.disablePrompt();
            app.router.go(route);
          }

          Notification.success(__t('item_has_been_saved'));
        };
      } else {
        success = function (model, response, options) {
          if (self.onSuccess) {
            self.onSuccess(model, response, options);
          }

          notifyParent();

          if (action === 'save-form-add') {
            goToNewItem();
          }

          // TODO: check if this view is a overlay then close the overlay
          //        instead redirecting to the listing page
          // -------------------------------------------------------------
          // if it's an overlay view do not go to any route
          if (!self.headerOptions.route.isOverlay) {
            var route = Backbone.history.fragment.split('/');

            route.pop();
            self.model.disablePrompt();
            app.router.go(route);
          }
        };
      }

      if (action === 'save-form-copy') {
        var clone = model.toJSON();
        delete clone.id;
        model = new collection.model({}, {collection: collection, parse: true});
        // Start tracking changes to mark the new values
        model.startTracking();
        model.set(clone);
        collection.add(model);
      }

      if (!model.unsavedAttributes()) {
        Notification.warning('Nothing changed, nothing saved');

        if (action === 'save-form-add') {
          goToNewItem();
        } else if (action !== 'save-form-stay') {
          notifyParent();
          // Go back to the table view unless we are supposed to stay on this page
          // Write this as a helper function
          var route = Backbone.history.fragment.split('/');
          route.pop();
          app.router.go(route);
        }

        return;
      }

      // Patch only the changed values if it's not new
      model.save(this.model.getChanges(false), {
        success: success,
        error: function (model, xhr, options) {
          // console.error('err');
          //Duplicate entry, forced but works
          //@todo finds a better way to determine whether there's an duplicate error
          // and what's the column's name
          var response = JSON.parse(xhr.responseText);
          var message = response.error.message;
          if (message.indexOf('Duplicate entry') !== -1) {
            var columnName = message.split('for key')[1].trim();
            columnName = columnName.substring(1, columnName.lastIndexOf("'"));
            app.router.openModal({type: 'alert', text: 'This item was not saved because its "' + columnName + '" value is not unique.'});
            return;
          }
        },
        wait: true,
        patch: !model.isNew(),
        includeRelationships: true
      });
    },

    afterRender: function () {
      this.setView('#page-content', this.editView);

      //Fetch Model if Exists
      if (!this.skipFetch && this.model.has(this.model.idAttribute)) {
        this.model.fetch({
          dontTrackChanges: true,
          error: function(model, XMLHttpRequest) {
            //If Cant Find Model Then Open New Entry Page
            if(404 === XMLHttpRequest.status) {
              var route = Backbone.history.fragment;

              route = route.split('/');
              if(route.slice(-2)[0] !== "tables") {
                route.pop();
              }
              route.push('new');
              app.router.go(route);
            }
          }
        });
      }
      this.editView.render();
    },

    leftToolbar: function () {
      var widgets = [];
      var isNew = this.model.isNew();
      var canAdd = this.model.collection.canAdd();
      var canEdit = this.model.collection.canEdit();
      var isOverlay = this.headerOptions.route.isOverlay === true;
      var editView = this;

      this.saveWidget = new Widgets.SaveWidget({
        widgetOptions: {
          basicSave: this.headerOptions.basicSave,
          singlePage: this.single
        },
        enabled: (isNew && canAdd) || (!isNew && canEdit),
        onClick: _.bind(editView.saveConfirm, editView)
      });

      if (canAdd && !isNew) {
        // NOTE: Set enable to true until we implement X2M
        editView.saveWidget.setEnabled(true);// this.model.hasChanges());
        // this.model.on('unsavedChanges', function (hasChanges, unsavedAttrs, model) {
        //   editView.saveWidget.setEnabled(hasChanges);
        // });
      }

      widgets.push(this.saveWidget);

      // delete button
      if (!isOverlay && !this.model.isNew() && !this.single && this.model.canDelete()) {
        this.deleteWidget = new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: 'deleteBtn',
            iconClass: 'close',
            buttonClass: 'serious',
            buttonText: __t('delete')
          },
          onClick: _.bind(editView.deleteConfirm, editView)
        });

        widgets.push(this.deleteWidget);
      }

      if (_.result(this, 'rightPane')) {
        this.infoWidget = new Widgets.InfoButtonWidget({
          enable: !this.model.isNew(),
          onClick: function (event) {
            editView.toggleRightPane();
          }
        });

        widgets.push(this.infoWidget);
      }

      return widgets;
    },

    rightPane: function () {
      return EditViewRightPane;
    },

    rightPaneOptions: function () {
      return {};
    },

    cleanup: function () {
      BasePageView.prototype.cleanup.apply(this, arguments);

      if (this.options.parentView) {
        this.model.stopTracking();
      }
    },

    initialize: function (options) {
      options = _.defaults({}, options, {
        omittedFields: this.omittedFields,
        skipFetch: false
      });

      this.headerOptions = this.getHeaderOptions();
      this.isBatchEdit = options.batchIds !== undefined;
      this.single = this.model.collection.table.get('single');
      this.editView = new EditView(options);
      this.headerOptions.route.isOverlay = false;
      this.skipFetch = options.skipFetch;
      this.onSuccess = options.onSuccess;

      app.checkUserEditingConflict();

      if (!this.model.isTracking()) {
        this.model.startTracking();
      }

      if (options.warnOnExit === true) {
        this.model.enablePrompt();
      }

      if (_.isUndefined(this.headerOptions.basicSave)) {
        this.headerOptions.basicSave = false;
      }

      if (this.single) {
        this.headerOptions.route.title = __t('editing_x', {
          name: app.capitalize(this.model.collection.table.id)
        });
        this.headerOptions.route.breadcrumbs = this.headerOptions.route.breadcrumbs || [{ title: __t('tables'), anchor: '#tables'}];
      } else {
        if (!this.headerOptions.route.title) {
          this.headerOptions.route.title = this.model.isNew() ? __t('creating_new_item') : __t('editing_item');
        }

        if (!this.headerOptions.route.breadcrumbs) {
          this.headerOptions.route.breadcrumbs = [{
            title: __t('tables'),
            anchor: '#tables'
          }, {title: this.model.collection.table.id, anchor: "#tables/" + this.model.collection.table.id}];
        }
      }
    }
  });
});
