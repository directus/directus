//  header..js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'backbone'
],

function(app, Backbone) {

  "use strict";

  var HeaderView = Backbone.Layout.extend({

    template: 'header',

    serialize: function() {
      var data = {
        title: this.collection.table.id,
        breadcrumbs: [{title: 'Tables', anchor: '#tables'}]
      };

      return data;
    },
    initialize: function(options) {
      this.options = options;
    }

  });

  return Table;
});