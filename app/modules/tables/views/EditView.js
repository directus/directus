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
  'modules/tables/views/HistoryView',
  'modules/tables/views/EditViewRightPane',
  'modules/tables/views/TranslationView'
],

function(app, Backbone, _, Handlebars, __t, Notification, Directus, BasePageView, Widgets, HistoryView, EditViewRightPane, TranslationView) {

  var EditView = Backbone.Layout.extend({
    template: Handlebars.compile('<div id="editFormEntry"></div><div id="translateFormEntry"></div><div id="historyFormEntry"></div>'),
    afterRender: function() {
      this.insertView("#editFormEntry", this.editView);
      // this.insertView("#historyFormEntry", this.historyView);

      if (this.translateViews.length) {
        _.each(this.translateViews, function(view) {
          this.insertView("#translateFormEntry", view);
        }, this);
      }

      if (this.skipFetch || this.model.isNew()) {
        this.editView.render();
      }
    },
    beforeSaveHook: function() {
      if (this.translateViews.length) {
        _.each(this.translateViews, function(view) {
          view.saveTranslation();
        }, this);
      }
    },
    data: function() {
      return this.editView.data();
    },
    initialize: function(options) {
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
      // this.historyView = new HistoryView(options);
    },
    serialize: function() {
      return {};
    }
  });

  return BasePageView.extend({
    events: {
      'change select, input[type=checkbox], input[type=radio]': 'checkDiff',
      'keyup input, textarea': 'checkDiff',
      'submit': function (e) {
        // prevent user submit the form using Enter key
        // @todo handle this event to or as 'saveConfirm'
        e.preventDefault();
      }
    },

    getHeaderOptions: function() {
      return {
        route: {
          title: 'Editing Item',
          isOverlay: false
        }
      };
    },

    checkDiff: function(e) {
      var diff = this.model.diff(this.editView.data());
      delete diff.id;
      this.saveWidget.enable();
    },

    saveConfirm: function (event) {
      this.save(event);
    },

    deleteConfirm: function () {
      var self = this;

      app.router.openModal({type: 'confirm', text: __t('confirm_delete_item'), callback: function () {
        var xhr = self.model.saveWithDeleteStatus();

        xhr.done(function () {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          app.router.go(route);
        });
      }});
    },

    save: function(e) {
      this.editView.beforeSaveHook();

      var action = this.single ? 'save-form-stay' : 'save-form-leave';
      if (e.target.options !== undefined && !this.single) {
        action = $(e.target.options[e.target.selectedIndex]).val();
      }

      var data = this.editView.data();

      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;

      for(var key in data) {
        if(model.structure.get(key).options && model.structure.get(key).options.get('allow_null') === '1') {
          if(data[key] === '') {
            data[key] = null;
          }
        }
      }

      if (action === 'save-form-stay') {
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');
          if (!model.table.get('single')) {
            route.pop();
            route.push(model.get('id'));
            app.router.go(route);
          }

          Notification.success(__t('item_has_been_saved'));
        };
      } else {
        var self = this;
        success = function(model, response, options) {
          var route = Backbone.history.fragment.split('/');

          route.pop();
          if (action === 'save-form-add') {
            // Trick the router to refresh this page when we are dealing with new items
            if (isNew) app.router.navigate("#", {trigger: false, replace: true});
            route.push('new');
          }

          if (self.onSuccess) {
            self.onSuccess(model, response, options);
          }

          // @TODO: check if this view is a overlay then close the overlay
          //        instead redirecting to the listing page
          // -------------------------------------------------------------
          // if it's an overlay view do not go to any route
          if (!self.headerOptions.route.isOverlay) {
            app.router.go(route);
          }
        };
      }
      if (action === 'save-form-copy') {
        // console.log('cloning...');
        var clone = model.toJSON();
        delete clone.id;
        model = new collection.model(clone, {collection: collection, parse: true});
        collection.add(model);
        // console.log(model);
      }

      var changedValues = _.extend(model.unsavedAttributes() || {}, model.diff(data));

      // patch only the changed values
      model.save(changedValues, {
        success: success,
        error: function(model, xhr, options) {
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
        patch: true,
        includeRelationships: true
      });
    },

    afterRender: function() {
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

    leftToolbar: function() {
      var widgets = [];
      var editView = this;

      this.saveWidget = new Widgets.SaveWidget({
        widgetOptions: {
          basicSave: this.headerOptions.basicSave,
          singlePage: this.single
        },
        onClick: _.bind(editView.saveConfirm, editView)
      });

      // this.saveWidget.disable();

      widgets.push(this.saveWidget);

      // delete button
      if (!this.model.isNew() && !this.single && this.model.canDelete()) {
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
          onClick: function (event) {
            editView.toggleRightPane();
          }
        });

        widgets.push(this.infoWidget);
      }

      return widgets;
    },

    rightPane: function() {
      return EditViewRightPane;
    },

    rightPaneOptions: function() {
      return {};
    },

    cleanup: function () {
      BasePageView.prototype.cleanup.apply(this, arguments);
      this.model.stopTracking();
    },

    initialize: function(options) {
      options = _.defaults({}, options, {skipFetch: false});
      this.headerOptions = this.getHeaderOptions();
      this.isBatchEdit = options.batchIds !== undefined;
      this.single = this.model.collection.table.get('single');
      this.editView = new EditView(options);
      this.headerOptions.route.isOverlay = false;
      this.skipFetch = options.skipFetch;
      this.onSuccess = options.onSuccess;

      this.model.startTracking();
      this.listenTo(this.model, 'sync', function () {
        this.model.restartTracking();
      });

      if (_.isUndefined(this.headerOptions.basicSave)) {
        this.headerOptions.basicSave = false;
      }

      if (this.single) {
        this.headerOptions.route.title = 'Editing ' + this.model.collection.table.id;
        this.headerOptions.route.breadcrumbs = this.headerOptions.route.breadcrumbs || [{ title: __t('tables'), anchor: '#tables'}];
      } else {
        this.headerOptions.route.title = this.model.get(this.model.idAttribute) ? __t('editing_item') : __t('creating_new_item');
        this.headerOptions.route.breadcrumbs = this.headerOptions.route.breadcrumbs|| [{ title: __t('tables'), anchor: '#tables'}, {title: this.model.collection.table.id, anchor: "#tables/" + this.model.collection.table.id}];
      }
    }
  });
});
