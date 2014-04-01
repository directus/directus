define([
  'app',
  'backbone'
],
function(app, Backbone) {

  "use strict";

  return Backbone.Layout.extend({
  
    template: Handlebars.compile('{{currentRange}} of {{total}}'),

    tagName: 'div',
    
    attributes: {
      class: 'tool vertical-center pagination-number'
    },

    events: {
      'click [data-add-filter-row]': function(e) {
      
      }
    },


    serialize: function() {
      var data = {
        currentRange: '501–1,000',
        total: '3,508'
      };
      
      return data;
    },

    getFilterRow: "adv search fields row object",

    afterRender: function() {
    
    },
  });
});