//  messages.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/directus',
  'core/panes/pane.saveview'
],

function(app, Backbone, Directus, SaveModule) {

  var Messages = app.module();

  Messages.Views.Edit = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      var title = this.model.isNew() ? 'Compose New' : 'Reading Message';
      return {title: title, sidebar: true};
    },

    beforeRender: function() {
      this.setView('#sidebar', new SaveModule({model: this.model, buttonText: 'Send Message', single: true}));
    },

    afterRender: function() {
      this.setView('#page-content', new Directus.EditView({model: this.model}));
      this.model.fetch();
      //this.setView('#page-content', new Directus.Table({collection: this.collection, navigate: true, hideColumnPreferences: true}));
      //this.collection.fetch();
    }

  });



  Messages.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      return {title: 'Messages'};
    },

    afterRender: function() {
      this.setView('#page-content', new Directus.Table({collection: this.collection, navigate: true, hideColumnPreferences: true}));
      this.collection.fetch();
    }

  });

  return Messages;

});