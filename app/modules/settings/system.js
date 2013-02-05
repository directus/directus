//  system.js
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

function(app, Directus) {

  var System = Backbone.Layout.extend({
    template: 'page',
    serialize: {
      title: 'System',
      breadcrumbs: [{title: 'Settings', anchor: '#settings'}]
    }
  });

  return System;
});