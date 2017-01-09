define([
  'app',
  'underscore',
  'backbone'
],
function(app, _, Backbone) {

  'use strict';

  return Backbone.Layout.extend({

    template: 'core/widgets/status',

    tagName: 'div',

    attributes: {
      class: 'status'
    },

    events: {
      'click ul': function(event) {
        this.$el.toggleClass('expanded');
      },

      'click li': function(event) {
        this.$('li').removeClass('active');
        $(event.currentTarget).addClass('active');
      }
    },

    serialize: function() {
      return {};
    },

    afterRender: function() {

    },

    initialize: function() {
    }
  });
});
