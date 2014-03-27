define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  Backbone.Layout.extend({

    template: Handlebars.compile('<a href="#" class="prev">Prev</a> <a href="#" class="next">Next</a>'),

    events: {

      'prev': function() {
        console.log('go prev');
      },

      'next': function() {
        console.log('go next');
      }

    },

    serialize: function() {

    }

  });

});