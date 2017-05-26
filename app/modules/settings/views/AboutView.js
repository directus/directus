//  about.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/BasePageView'
],

function(app, Backbone, BasePageView) {

  'use strict';

  var About = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'About',
        breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
      }
    },
    afterRender: function() {
      var view = new Backbone.Layout({template: 'modules/settings/settings-about'});
      this.setView('#page-content', view);
      view.render();
    }
  });

  return About;
});
