//  global.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/directus',
  'core/BasePageView'
],

function(app, Backbone, Directus, BasePageView) {

  "use strict";

  var Global = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Settings',
        breadcrumbs: [{ title: 'Settings', anchor: '#settings'}]
      },
    },

    events: {
      'click #save-form': function() {
        var data = this.editView.data();
        var success = function() { app.router.go('settings'); };
        this.model.save(data, {success: success});
      },
      'click #save-form-cancel': function() {
        app.router.go('settings');
      }
    },

    beforeRender: function() {
      this.setView('#page-content', this.editView);
      this.setView('#sidebar', new Backbone.Layout({template: 'module-save', attributes: {'class': 'directus-module'}, serialize: {showActive: false, buttonText: 'Save', showDropdown: false, showDelete: false, canEdit:true}}));
    },

    initialize: function(options) {
      this.editView = new Directus.EditView({model: this.model, structure: options.structure});
      this.headerOptions.route.title = this.options.title;
    }

  });

  return Global;

});