//  header.secondaryrowview.js
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

  var HeaderSecondaryRowView = Backbone.Layout.extend({

    template: 'header/header-secondary-row',

    tagName: 'div',

    serialize: function() {
      var data = {};

      if(this.options.canSearch) {
        data.search = true;
      }

      if(this.options.mode == "edit") {
        data.edit = true;
      }

      return data;
    }
  });

  return HeaderSecondaryRowView;
});