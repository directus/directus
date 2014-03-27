define([
  "app",
  "backbone",
  "core/directus",
  'core/panes/pane.saveview',
  'core/BasePageView'
],

function(app, Backbone, Directus, SaveModule, BasePageView) {

  "use strict";


  return BasePageView.extend({

    events: {
      'click #save-form': function(e) {
        var data = $('form').serializeObject();
        var model = this.model;
        data.active = $('input[name=active]:checked').val();

        //Dont include empty passwords!
        if (data.password === "") {
          delete data.password;
        }

        var diff = model.diff(data);

        var options = {
          success: function() { app.router.go('#users'); },
          error: function() { console.log('error',arguments); },
          patch: true,
          includeRelationships: true
        };

        // @todo, fix EntriesCollection and get rid of this
        if (!model.isNew()) {
          options.ignoreWriteFieldBlacklisted = true;
        }

        model.save(diff, options);
      },

      'click #delete-form': function(e) {
        this.model.save({active: 0}, {success: function() {
          app.router.go('#users');
        }, patch: true});
      }
    },

    serialize: function() {
      var breadcrumbs = [{ title: 'Users', anchor: '#users'}];
      var title = (this.model.id) ? this.model.get('first_name') + ' ' + this.model.get('last_name') : 'New User';

      return {
        breadcrumbs: breadcrumbs,
        title: title,
        sidebar: true
      };
    },

    beforeRender: function() {
      this.setView('#sidebar', new SaveModule({model: this.model}));
    },

    afterRender: function() {
      var editView = new Directus.EditView({model: this.model});
      this.setView('#page-content', editView);
      if (!this.model.isNew()) {
        this.model.fetch();
      } else {
        editView.render();
      }
    }
  });



});