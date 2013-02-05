//  messages.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone',
  'core/directus'
],

function(app, Backbone, Directus) {

  var Messages = app.module();

  Messages.Views.List = Backbone.Layout.extend({

    template: 'page',

    serialize: function() {
      return {title: 'Messages'};
    },

    beforeRender: function() {
      console.log(this.collection);
      this.setView('#page-content', new Directus.Table({collection: this.collection}));
    }

  });

  return Messages;

});