define([
  'app',
  'backbone',
  'core/panes/pane.saveview',
  'core/panes/pane.revisionsview',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets'
],

function(app, Backbone, SaveModule, RevisionsModule, Directus, BasePageView, Widgets) {

  return BasePageView.extend({
    events: {
      'click .saved-success': 'save',
      'change #saveSelect': 'save'
    },

    deleteItem: function(e) {
      var success = function() {
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);
      };

      // hard-destroy model if there is no active column
      if (!this.model.has('active')){
        throw "This table does not have an active column and can therefore not be deleted";
      }

      this.model.save({active: 0}, {success: success, patch: true, wait: true, validate: false});
    },

    save: function(e) {
      var action = 'save-form-leave';
      if(e.target.options !== undefined) {
        action = $(e.target.options[e.target.selectedIndex]).val();
      }
      var data = this.editView.data();
      var model = this.model;
      var isNew = this.model.isNew();
      var collection = this.model.collection;
      var success;

      if(data.active && data.active == 0) {
        if(!confirm("Are you sure you wish to delete this item?")) {
          return;
        }
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
        error: function(model, xhr, options) {
          console.log('err');
          //app.trigger('alert:error', 'Failed to Save', xhr.responseText);
        },
        wait: true,
        patch: true,
        includeRelationships: true
      });
    },

    afterRender: function() {
      this.setView('#page-content', this.editView);

      //Fetch Model if Exists
      if (this.model.has('id')) {
        this.model.fetch({
          dontTrackChanges: true,
          error: function(model, XMLHttpRequest) {
            //If Cant Find Model Then Open New Entry Page
            if(404 === XMLHttpRequest.status) {
              var route = Backbone.history.fragment;
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

    leftToolbar: function() {
      this.saveWidget = new Widgets.SaveWidget();
      this.saveWidget.setSaved(false);
      return [
        this.saveWidget
      ];
    },

    headerOptions: {
      route: {
        title: 'Edit File',
        breadcrumbs: [{ title: 'Files', anchor: '#files'}],
        isOverlay: false
      },
      basicSave: false,
    },


    initialize: function(options) {
      this.editView = new Directus.EditView({model: this.model, ui: this.options.ui});
      this.headerOptions.route.title = this.model.get('id') ? 'Editing File' : 'Uploading New File';
      this.collection = app.media;
    }
  });
});