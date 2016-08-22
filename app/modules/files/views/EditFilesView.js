define([
  'app',
  'backbone',
  'core/t',
  'core/directus',
  'core/BasePageView',
  'core/widgets/widgets'
],

function(app, Backbone, __t, Directus, BasePageView, Widgets) {

  return BasePageView.extend({
    events: {
      'click .saved-success > .tool-item, .saved-success > span > .simple-select': 'saveCheck',
      'change #saveSelect': 'saveCheck'
    },

    deleteItem: function(e) {
      var success = function() {
        var route = Backbone.history.fragment.split('/');
        route.pop();
        app.router.go(route);
      };

      var value = app.statusMapping.deleted_num;
      var options = {success: success, patch: true, wait: true, validate: false};
      try {
        app.changeItemStatus(this.model, value, options);
      } catch(e) {
        setTimeout(function() {
          app.router.openModal({type: 'alert', text: e.message});
        }, 0);
      }
    },

    saveCheck: function(e) {
      var data = this.editView.data();
      if(data[app.statusMapping.status_name] && data[app.statusMapping.status_name] === app.statusMapping.deleted_num) {
        var that = this;
        app.router.openModal({type: 'confirm', text: 'Are you sure? This item will be removed from the system!', callback: function() {
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

    afterRender: function() {
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

    leftToolbar: function() {
      this.saveWidget = new Widgets.SaveWidget();
      this.saveWidget.setSaved(false);
      return [
        this.saveWidget
      ];
    },

    headerOptions: {
      route: {
        title: __t('edit_file'),
        breadcrumbs: [{ title: __t('files'), anchor: '#files'}],
        isOverlay: false
      },
      basicSave: false,
    },


    initialize: function(options) {
      this.editView = new Directus.EditView({model: this.model, ui: this.options.ui});
      this.headerOptions.route.title = this.model.get('id') ? __t('editing_file') : __t('uploading_new_file');
      this.collection = app.files;
    }
  });
});
