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

  var Header = app.module();

  Header.HeaderModel = Backbone.Model.extend({
    setRoute: function(title, breadcrumbs) {
      var data = {
        title: title,
        breadcrumbs: breadcrumbs
      };
      this.set({route: data});
    }
  });

  Header.HeaderView = Backbone.Layout.extend({

    template: 'header',

    serialize: function() {
      var data = this.model.get('route');

      if(data === undefined) {
        data = {
          title: "UNDEFINED! FIX ME!!!!"
        };
      }

      return data;
    },
    initialize: function(options) {
      this.options = options;

      this.model.on('change', this.render, this);
    }

  });

  return Header;
});