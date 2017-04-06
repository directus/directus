define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets'
],

function(app, _, Backbone, __t, Directus, BasePageView, Widgets) {

  return BasePageView.extend({

    events: {
      'change input, select, textarea': 'checkDiff',
      'keyup input, textarea': 'checkDiff'
    },

    checkDiff: function () {
      var diff = this.model.diff(this.editView.data());
      delete diff.id;
      this.saveWidget.enable();
    },

    deleteConfirm: function () {
      var self = this;

      app.router.openModal({type: 'confirm', text: __t('confirm_delete_item'), callback: function () {
        var xhr = self.model.saveWithDeleteStatus();

        xhr.then(function () {
          var route = Backbone.history.fragment.split('/');
          route.pop();
          app.router.go(route);
        });
      }});
    },

    saveConfirm: function (event) {
      this.save(event);
    },

    save: function (e) {
      var action = 'save-form-leave';
      if(e.target.options !== undefined) {
        action = $(e.target.options[e.target.selectedIndex]).val();
      }
      var data = this.editView.data();
      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;

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
        console.log('cloning...');
        var clone = model.toJSON();
        delete clone.id;
        model = new collection.model(clone, {collection: collection, parse: true});
        collection.add(model);
        console.log(model);
      }

      // patch only the changed values
      model.save(model.diff(data), {
        success: success,
        wait: true,
        patch: true,
        includeRelationships: true
      });
    },

    afterRender: function () {
      this.setView('#page-content', this.editView);

      //Fetch Model if Exists
      if (this.model.has('id')) {
        this.model.fetch({
          dontTrackChanges: true,
          error: function(model, XMLHttpRequest) {
            //If Cant Find Model Then Open New Entry Page
            if(404 === XMLHttpRequest.status) {
              var route = Backbone.history.fragment.split('/');
              route.pop();
              route.push('new');
              app.router.go(route);
            }
          }
        });
      } else {
        this.editView.render();
      }
    },

    leftToolbar: function () {
      var widgets = [];
      var editView = this;
      this.saveWidget = new Widgets.SaveWidget({
        widgetOptions: {
          basicSave: this.headerOptions.basicSave,
          singlePage: this.single
        },
        onClick: _.bind(editView.saveConfirm, editView)
      });

      widgets.push(this.saveWidget);

      this.saveWidget.disable();

      // delete button
      if (!this.model.isNew()) {
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


    initialize: function () {
      this.editView = new Directus.EditView({model: this.model, ui: this.options.ui});
      this.headerOptions.route.title = this.model.get('id') ? __t('editing_file') : __t('uploading_new_file');
      this.collection = app.files;
    }
  });
});
