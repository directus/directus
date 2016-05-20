define([
  "app",
  "backbone",
  "core/directus",
  'core/BasePageView',
  'core/widgets/widgets'
],

function(app, Backbone, Directus, BasePageView, Widgets) {

  "use strict";


  return BasePageView.extend({

    headerOptions: {
      route: {
        title: 'Edit User',
        breadcrumbs: [{ title: 'Users', anchor: '#users'}]
      }
    },

    events: {
      'click .saved-success > #save': 'saveConfirm',
      'change #saveSelect': 'saveConfirm'
    },

    saveConfirm: function(e) {
      var data = this.editView.data();
      var that = this;
      if(data[app.statusMapping.status_name] && data[app.statusMapping.status_name] == app.statusMapping.deleted_num) {
        app.router.openModal({type: 'confirm', text: 'Are you sure you want to delete this item?', callback: function() {
          that.save(e);
        }});
      } else {
        this.save(e);
      }
    },

    save: function(e) {
      var action = 'save-form-leave';
      if(e.target.options !== undefined) {
        action = $(e.target.options[e.target.selectedIndex]).val();
      }
      var data =  $('form').serializeObject();
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
          console.log("Success");
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
      }

      // patch only the changed values
      model.save(model.diff(data), {
        success: success,
        error: function(model, xhr, options) {
          console.log('err');
        },
        wait: true,
        patch: true,
        includeRelationships: true
      });
    },

    leftToolbar: function() {
      this.saveWidget = new Widgets.SaveWidget({widgetOptions: {basicSave: this.headerOptions.basicSave}});
      this.saveWidget.setSaved(false);
      return [
        this.saveWidget
      ];
    },

    afterRender: function() {
      var editView = this.editView;
      this.setView('#page-content', editView);
      if (!this.model.isNew()) {
        this.model.fetch();
      } else {
        editView.render();
      }
    },

    initialize: function(options) {
      this.editView = new Directus.EditView({model: this.model});
      this.headerOptions.route.title = (this.model.id) ? this.model.get('first_name') + ' ' + this.model.get('last_name') : 'New User';
    }
  });
});
