define([
  'app',
  'backbone',
  'underscore',
  'handlebars',
  'core/t',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets',
  'modules/tables/views/HistoryView',
  'modules/tables/views/EditViewRightPane',
  'modules/tables/views/TranslationView'
],

function(app, Backbone, _, Handlebars, __t, Directus, BasePageView, Widgets, HistoryView, EditViewRightPane, TranslationView) {

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

      options.hiddenFields = [];
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
      'change input, select, textarea': 'checkDiff',
      'keyup input, textarea': 'checkDiff',
      'submit': function(e) {
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

    deleteItem: function(e) {
      var success = function() {
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);
      };
      //@todo: who trigger this?
      var options = {success: success, patch: true, wait: true, validate: false};
      try {
        app.changeItemStatus(model, value, options);
      } catch(e) {
        setTimeout(function() {
          app.router.openModal({type: 'alert', text: e.message});
        }, 0);
      }
    },

    saveConfirm: function(e) {
      var data = this.editView.data();
      var that = this;
      if(data[app.statusMapping.status_name] && data[app.statusMapping.status_name] === app.statusMapping.deleted_num) {
        app.router.openModal({type: 'confirm', text: __t('confirm_delete_item'), callback: function () {
          that.save(e);
        }});
      } else {
        this.save(e);
      }
    },

    deleteConfirm: function () {
      var self = this;
      // @TODO: table has different status
      var attributes = {};
      attributes[app.statusMapping.status_name] = 0;
      app.router.openModal({type: 'confirm', text: __t('confirm_delete_item'), callback: function () {
        self.model.save(attributes).then(function () {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          app.router.go(route);
        });
      }});
    },

    save: function(e) {
      this.editView.beforeSaveHook();

      var action = 'save-form-leave';
      if(e.target.options !== undefined) {
        action = $(e.target.options[e.target.selectedIndex]).val();
      }

      if(this.single && action !== 'save-form-stay' && action !== 'save-form-leave') {
        console.error('This shouldn\'t be happening');
        return;
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
          if(!model.table.get('single')) {
            route.pop();
            route.push(model.get('id'));
            app.router.go(route);
          }
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
        console.log('cloning...');
        var clone = model.toJSON();
        delete clone.id;
        model = new collection.model(clone, {collection: collection, parse: true});
        collection.add(model);
        console.log(model);
      }

      var changedValues = _.extend(model.unsavedAttributes(), model.diff(data));

      if (changedValues[app.statusMapping.status_name] && changedValues[app.statusMapping.status_name] === app.statusMapping.deleted_num ) {
        var value = app.statusMapping.deleted_num;
        var options = {success: success, wait: true, patch: true, includeRelationships: true};
        try {
          app.changeItemStatus(this.model, value, options);
        } catch(e) {
          setTimeout(function() {
            app.router.openModal({type: 'alert', text: e.message});
          }, 0);
        }
      } else {
        // patch only the changed values
        model.save(changedValues, {
          success: success,
          error: function(model, xhr, options) {
            console.error('err');
            //Duplicate entry, forced but works
            //@todo finds a better way to determine whether there's an duplicate error
            // and what's the column's name
            var response = JSON.parse(xhr.responseText);
            if (response.message.indexOf('Duplicate entry') !== -1) {
              var columnName = response.message.split('for key')[1].trim();
              columnName = columnName.substring(1, columnName.lastIndexOf("'"));
              app.router.openModal({type: 'alert', text: 'This item was not saved because its "' + columnName + '" value is not unique.'});
              return;
            }
          },
          wait: true,
          patch: true,
          includeRelationships: true
        });
      }
      this.$el.find('#saveSelect').val('');
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

      this.saveWidget.disable();

      widgets.push(this.saveWidget);

      // delete button
      if (!this.model.isNew() && !this.single) {
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
        this.infoWidget = new Widgets.ButtonWidget({
          widgetOptions: {
            buttonId: '',
            iconClass: 'info',
            buttonClass: '',
            buttonText: __t('details')
          },
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
